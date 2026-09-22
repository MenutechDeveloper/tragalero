import 'dart:io';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/order.dart';
import '../models/printer.dart';
import 'supabase_service.dart';

class PrinterService {
  /// ESC/POS Command Constants for Epson TM-T20III
  static const List<int> escInit = [0x1B, 0x40];
  static const List<int> escAlignLeft = [0x1B, 0x61, 0x00];
  static const List<int> escAlignCenter = [0x1B, 0x61, 0x01];
  static const List<int> escAlignRight = [0x1B, 0x61, 0x02];
  static const List<int> escBoldOn = [0x1B, 0x45, 0x01];
  static const List<int> escBoldOff = [0x1B, 0x45, 0x00];
  static const List<int> escDoubleSize = [0x1D, 0x21, 0x11];
  static const List<int> escNormalSize = [0x1D, 0x21, 0x00];
  static const List<int> escCutPaper = [0x1D, 0x56, 0x41, 0x03]; // ESC/POS Paper Cut

  /// Fetches saved printers from Supabase and SharedPreferences
  static Future<List<PrinterModel>> fetchPrinters() async {
    final user = SupabaseService.currentUser;
    List<PrinterModel> printers = [];

    if (user != null) {
      try {
        final response = await SupabaseService.client
            .from('tragalero_printers')
            .select('*')
            .eq('user_id', user.id);

        printers = (response as List)
            .map((p) => PrinterModel.fromMap(p))
            .toList();
      } catch (e) {
        // Fallback to local
      }
    }

    if (printers.isEmpty) {
      final prefs = await SharedPreferences.getInstance();
      final localJson = prefs.getString('local_printers');
      if (localJson != null) {
        final List decoded = json.decode(localJson);
        printers = decoded.map((p) => PrinterModel.fromMap(p)).toList();
      }
    }

    return printers;
  }

  /// Saves a new printer to Supabase and SharedPreferences
  static Future<bool> addPrinter(PrinterModel printer) async {
    final user = SupabaseService.currentUser;
    bool savedRemote = false;

    if (user != null) {
      try {
        await SupabaseService.client.from('tragalero_printers').insert({
          'user_id': user.id,
          'name': printer.name,
          'ip': printer.ip,
          'port': printer.port,
          'status': 'online',
        });
        savedRemote = true;
      } catch (e) {
        // Fallback
      }
    }

    // Save locally
    final prefs = await SharedPreferences.getInstance();
    final List<PrinterModel> existing = await fetchPrinters();
    existing.add(printer);
    prefs.setString('local_printers', json.encode(existing.map((p) => p.toMap()).toList()));

    return savedRemote || true;
  }

  /// Connects to Epson TM-T20III printer over Ethernet TCP/IP on port 9100
  static Future<bool> testPrinterConnection(String ip, int port) async {
    try {
      final socket = await Socket.connect(ip, port, timeout: const Duration(seconds: 3));

      // Send ESC/POS Init & Test text
      final List<int> bytes = [];
      bytes.addAll(escInit);
      bytes.addAll(escAlignCenter);
      bytes.addAll(escBoldOn);
      bytes.addAll(latin1.encode('TRAGALERO - TEST EPSON TM-T20III\n\n'));
      bytes.addAll(escBoldOff);
      bytes.addAll(escAlignLeft);
      bytes.addAll(latin1.encode('Impresora Ethernet conectada correctamente.\nIP: $ip:$port\n\n\n\n'));
      bytes.addAll(escCutPaper);

      socket.add(bytes);
      await socket.flush();
      await socket.close();

      return true;
    } catch (e) {
      return false;
    }
  }

  /// Prints an order ticket to the first available connected Epson TM-T20III printer
  static Future<bool> printOrderTicket(OrderModel order) async {
    final printers = await fetchPrinters();
    if (printers.isEmpty) return false;

    final targetPrinter = printers.first;
    try {
      final socket = await Socket.connect(targetPrinter.ip, targetPrinter.port, timeout: const Duration(seconds: 4));

      final List<int> bytes = [];
      bytes.addAll(escInit);

      // Header
      bytes.addAll(escAlignCenter);
      bytes.addAll(escDoubleSize);
      bytes.addAll(escBoldOn);
      bytes.addAll(latin1.encode('TRAGALERO\n'));
      bytes.addAll(escNormalSize);
      bytes.addAll(latin1.encode('TICKET DE ORDEN\n'));
      bytes.addAll(latin1.encode('================================\n\n'));

      // Order info
      bytes.addAll(escAlignLeft);
      bytes.addAll(latin1.encode('Orden #: #${order.id}\n'));
      bytes.addAll(latin1.encode('Cliente: ${order.customerName}\n'));
      bytes.addAll(latin1.encode('Telefono: ${order.customerPhone}\n'));
      bytes.addAll(latin1.encode('Tipo: ${order.orderType == 'delivery' ? 'A Domicilio' : 'Para Llevar'}\n'));
      if (order.address.isNotEmpty) {
        bytes.addAll(latin1.encode('Direccion: ${order.address}\n'));
      }
      bytes.addAll(latin1.encode('================================\n'));
      bytes.addAll(escBoldOn);
      bytes.addAll(latin1.encode('PRODUCTOS:\n'));
      bytes.addAll(escBoldOff);

      // Items
      for (var item in order.items) {
        final line = '${item.quantity}x ${item.name}';
        final price = '\$${item.total.toStringAsFixed(2)}';
        bytes.addAll(latin1.encode('$line  $price\n'));
        if (item.instructions != null && item.instructions!.isNotEmpty) {
          bytes.addAll(latin1.encode('  Nota: "${item.instructions}"\n'));
        }
      }

      bytes.addAll(latin1.encode('================================\n'));
      bytes.addAll(escAlignCenter);
      bytes.addAll(escDoubleSize);
      bytes.addAll(escBoldOn);
      bytes.addAll(latin1.encode('TOTAL: \$${order.total.toStringAsFixed(2)}\n'));
      bytes.addAll(escNormalSize);
      bytes.addAll(escBoldOff);
      bytes.addAll(latin1.encode('¡Gracias por su compra!\n\n\n\n'));
      bytes.addAll(escCutPaper);

      socket.add(bytes);
      await socket.flush();
      await socket.close();

      return true;
    } catch (e) {
      return false;
    }
  }
}
