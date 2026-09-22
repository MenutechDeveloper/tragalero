import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/supabase_service.dart';
import '../services/printer_service.dart';
import '../services/tts_service.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<OrderModel> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadOrders();
    _setupRealtimeSubscription();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    final fetched = await SupabaseService.fetchOrders();
    setState(() {
      _orders = fetched;
      _isLoading = false;
    });
  }

  void _setupRealtimeSubscription() {
    SupabaseService.subscribeToOrders((payload) {
      if (payload['eventType'] == 'INSERT') {
        final newOrder = OrderModel.fromMap(payload['new']);
        if (!_orders.any((o) => o.id.toString() == newOrder.id.toString())) {
          setState(() {
            _orders.insert(0, newOrder);
          });
          // Trigger Voice speech synthesis and sound alert on new order
          TtsService.speakNewOrder(newOrder);
        }
      } else if (payload['eventType'] == 'UPDATE') {
        final updated = OrderModel.fromMap(payload['new']);
        final index = _orders.indexWhere((o) => o.id.toString() == updated.id.toString());
        if (index != -1) {
          setState(() {
            _orders[index] = updated;
          });
        }
      } else if (payload['eventType'] == 'DELETE') {
        final oldId = payload['old']['id'].toString();
        setState(() {
          _orders.removeWhere((o) => o.id.toString() == oldId);
        });
      }
    });
  }

  List<OrderModel> _getFilteredOrders(String statusGroup) {
    if (statusGroup == 'pending') {
      return _orders.where((o) => o.status == 'pending').toList();
    } else if (statusGroup == 'accepted') {
      return _orders.where((o) => o.status == 'accepted' || o.status == 'preparing').toList();
    } else if (statusGroup == 'finished') {
      return _orders.where((o) => o.status == 'finished').toList();
    } else {
      return _orders.where((o) => o.status == 'delivered' || o.status == 'rejected').toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _getFilteredOrders('pending').length;
    final acceptedCount = _getFilteredOrders('accepted').length;
    final finishedCount = _getFilteredOrders('finished').length;
    final historyCount = _getFilteredOrders('history').length;

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.restaurant, color: Color(0xFFFF9533)),
            SizedBox(width: 8),
            Text('TRAGALERO ADMIN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: const Color(0xFFFF9533),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFFFF9533),
          tabs: [
            Tab(text: 'Pendientes ($pendingCount)'),
            Tab(text: 'En Proceso ($acceptedCount)'),
            Tab(text: 'Listas ($finishedCount)'),
            Tab(text: 'Historial ($historyCount)'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF9533)))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOrderList(_getFilteredOrders('pending')),
                _buildOrderList(_getFilteredOrders('accepted')),
                _buildOrderList(_getFilteredOrders('finished')),
                _buildOrderList(_getFilteredOrders('history')),
              ],
            ),
    );
  }

  Widget _buildOrderList(List<OrderModel> orders) {
    if (orders.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 64, color: Colors.grey),
            SizedBox(height: 12),
            Text('No hay órdenes en esta sección', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return _buildOrderCard(order);
      },
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    final timeStr = "${order.createdAt.hour.toString().padLeft(2, '0')}:${order.createdAt.minute.toString().padLeft(2, '0')}";

    Color statusColor = const Color(0xFFFF9533);
    String statusText = 'Pendiente';

    switch (order.status) {
      case 'accepted':
        statusColor = Colors.blue;
        statusText = 'Aceptada';
        break;
      case 'preparing':
        statusColor = Colors.purple;
        statusText = 'En Preparación';
        break;
      case 'finished':
        statusColor = Colors.green;
        statusText = 'Lista';
        break;
      case 'delivered':
        statusColor = Colors.grey;
        statusText = 'Entregada';
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusText = 'Rechazada';
        break;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: Start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.customerName,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText.toUpperCase(),
                    style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.phone, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(order.customerPhone, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                const SizedBox(width: 16),
                const Icon(Icons.access_time, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(timeStr, style: const TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
            if (order.address.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(order.address, style: const TextStyle(color: Colors.grey, fontSize: 13), overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ],
            const Divider(height: 20),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: order.items.map((item) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("${item.quantity > 1 ? '${item.quantity}x ' : ''}${item.name}", style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                        Text("\$${item.total.toStringAsFixed(2)}", style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('TOTAL:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                Text('\$${order.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFFFF9533))),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                // Print Ticket Button for Epson TM-T20III
                IconButton(
                  icon: const Icon(Icons.print, color: Color(0xFFFF9533)),
                  tooltip: 'Imprimir Ticket Epson',
                  onPressed: () async {
                    final success = await PrinterService.printOrderTicket(order);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(success ? '¡Ticket impreso en Epson TM-T20III!' : 'No hay impresora configurada o no se pudo conectar.'),
                          backgroundColor: success ? Colors.green : Colors.red,
                        ),
                      );
                    }
                  },
                ),
                const SizedBox(width: 8),
                Expanded(child: _buildActionButtons(order)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(OrderModel order) {
    if (order.status == 'pending') {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
              onPressed: () => SupabaseService.updateOrderStatus(order.id, 'rejected'),
              child: const Text('RECHAZAR'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF9533), foregroundColor: Colors.white),
              onPressed: () => SupabaseService.updateOrderStatus(order.id, 'accepted'),
              child: const Text('ACEPTAR'),
            ),
          ),
        ],
      );
    } else if (order.status == 'accepted') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
          onPressed: () => SupabaseService.updateOrderStatus(order.id, 'preparing'),
          child: const Text('PREPARAR'),
        ),
      );
    } else if (order.status == 'preparing') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
          onPressed: () => SupabaseService.updateOrderStatus(order.id, 'finished'),
          child: const Text('LISTO'),
        ),
      );
    } else if (order.status == 'finished') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.grey.shade800, foregroundColor: Colors.white),
          onPressed: () => SupabaseService.updateOrderStatus(order.id, 'delivered'),
          child: const Text('ENTREGAR'),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
