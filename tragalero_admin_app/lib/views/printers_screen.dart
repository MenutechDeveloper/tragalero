import 'package:flutter/material.dart';
import '../models/printer.dart';
import '../services/printer_service.dart';

class PrintersScreen extends StatefulWidget {
  const PrintersScreen({super.key});

  @override
  State<PrintersScreen> createState() => _PrintersScreenState();
}

class _PrintersScreenState extends State<PrintersScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _ipController = TextEditingController();
  final _portController = TextEditingController(text: '9100');

  List<PrinterModel> _printers = [];
  bool _isLoading = true;
  bool _isTesting = false;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _loadPrinters();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ipController.dispose();
    _portController.dispose();
    super.dispose();
  }

  Future<void> _loadPrinters() async {
    setState(() => _isLoading = true);
    final fetched = await PrinterService.fetchPrinters();
    setState(() {
      _printers = fetched;
      _isLoading = false;
    });
  }

  Future<void> _handleTestAndSavePrinter() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isTesting = true;
      _statusMessage = 'Probando conexión TCP/IP con Epson TM-T20III...';
    });

    final ip = _ipController.text.trim();
    final port = int.tryParse(_portController.text.trim()) ?? 9100;
    final name = _nameController.text.trim();

    final connected = await PrinterService.testPrinterConnection(ip, port);

    if (connected) {
      final newPrinter = PrinterModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: '',
        name: name,
        ip: ip,
        port: port,
        status: 'online',
      );

      await PrinterService.addPrinter(newPrinter);
      _nameController.clear();
      _ipController.clear();

      setState(() {
        _isTesting = false;
        _statusMessage = '¡Impresora Epson TM-T20III conectada con éxito!';
      });

      await _loadPrinters();
    } else {
      setState(() {
        _isTesting = false;
        _statusMessage = 'Error: No se pudo conectar a $ip:$port. Verifica que esté en la misma red Ethernet.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Impresoras Ethernet Epson', style: TextStyle(fontWeight: FontWeight.bold)),
          bottom: const TabBar(
            labelColor: Color(0xFFFF9533),
            indicatorColor: Color(0xFFFF9533),
            tabs: [
              Tab(icon: Icon(Icons.add_link), text: 'Configurar'),
              Tab(icon: Icon(Icons.print), text: 'Conectadas'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildSetupTab(),
            _buildPrintersListTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildSetupTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Card(
              color: Color(0xFFFFF7ED),
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.info, color: Color(0xFFFF9533)),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Conecta tu impresora Epson TM-T20III por cable Ethernet a tu red local e introduce su dirección IP.',
                        style: TextStyle(fontSize: 13, color: Color(0xFF9A3412)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Nombre Personalizado (Ej. Cocina, Barra)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.label),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Ingresa un nombre' : null,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _ipController,
                    keyboardType: TextInputType.datetime,
                    decoration: InputDecoration(
                      labelText: 'Dirección IP (Ej. 192.168.1.200)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: const Icon(Icons.wifi),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Ingresa la IP' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 1,
                  child: TextFormField(
                    controller: _portController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Puerto',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Puerto' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF9533),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isTesting ? null : _handleTestAndSavePrinter,
                icon: _isTesting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.network_check),
                label: Text(_isTesting ? 'PROBANDO CONEXIÓN...' : 'CONECTAR Y PROBAR IMPRESORA'),
              ),
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _statusMessage!.contains('éxito') ? Colors.green.shade50 : Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _statusMessage!.contains('éxito') ? Colors.green : Colors.orange),
                ),
                child: Text(
                  _statusMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: _statusMessage!.contains('éxito') ? Colors.green.shade800 : Colors.orange.shade900,
                  ),
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildPrintersListTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFFF9533)));
    }

    if (_printers.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.print_disabled, size: 64, color: Colors.grey),
            SizedBox(height: 12),
            Text('No hay impresoras conectadas', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _printers.length,
      itemBuilder: (context, index) {
        final printer = _printers[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: const CircleAvatar(
              backgroundColor: Color(0xFFFFF7ED),
              child: Icon(Icons.print, color: Color(0xFFFF9533)),
            ),
            title: Text(printer.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Epson Ethernet • ${printer.ip}:${printer.port}'),
            trailing: IconButton(
              icon: const Icon(Icons.wifi_find, color: Color(0xFFFF9533)),
              tooltip: 'Probar Ticket',
              onPressed: () async {
                final ok = await PrinterService.testPrinterConnection(printer.ip, printer.port);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? '¡Ticket de prueba enviado a ${printer.name}!' : 'No se pudo comunicar con ${printer.ip}'),
                      backgroundColor: ok ? Colors.green : Colors.red,
                    ),
                  );
                }
              },
            ),
          ),
        );
      },
    );
  }
}
