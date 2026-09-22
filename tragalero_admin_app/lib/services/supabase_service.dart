import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/order.dart';

class SupabaseService {
  static const String supabaseUrl = 'https://jqmmzufomzcsyzdskxze.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbW16dWZvbXpjc3l6ZHNreHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDE1NTgsImV4cCI6MjA4ODMxNzU1OH0.mAd28JHZmLZGLd4Z3r59SgtSdeEpMyZd_WJdrD381Vs';

  static SupabaseClient get client => Supabase.instance.client;

  static User? get currentUser => client.auth.currentUser;

  /// Fetches orders for the active user sorted by date
  static Future<List<OrderModel>> fetchOrders() async {
    final user = currentUser;
    if (user == null) return [];

    final response = await client
        .from('tragalero_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', ascending: false);

    return (response as List)
        .map((data) => OrderModel.fromMap(data))
        .toList();
  }

  /// Updates order status in real-time
  static Future<bool> updateOrderStatus(dynamic orderId, String newStatus, {String? rejectionReason}) async {
    try {
      final updates = <String, dynamic>{
        'status': newStatus,
      };

      final now = DateTime.now().toIso8601String();
      if (newStatus == 'accepted') updates['accepted_at'] = now;
      if (newStatus == 'preparing') updates['preparing_at'] = now;
      if (newStatus == 'finished') updates['ready_at'] = now;
      if (newStatus == 'delivered') updates['delivered_at'] = now;
      if (newStatus == 'rejected') {
        updates['rejected_at'] = now;
        if (rejectionReason != null) updates['rejection_reason'] = rejectionReason;
      }

      await client.from('tragalero_orders').update(updates).eq('id', orderId);
      return true;
    } catch (e) {
      // Fallback update status only if timestamp column missing
      try {
        await client.from('tragalero_orders').update({'status': newStatus}).eq('id', orderId);
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  /// Listens to real-time order changes
  static RealtimeChannel subscribeToOrders(Function(Map<String, dynamic> payload) onOrderChange) {
    final user = currentUser;
    final userId = user?.id ?? '';

    final channel = client.channel('app_orders_realtime_$userId');

    channel.onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'tragalero_orders',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'user_id',
        value: userId,
      ),
      callback: (payload) {
        onOrderChange({
          'eventType': payload.eventType.name,
          'new': payload.newRecord,
          'old': payload.oldRecord,
        });
      },
    ).subscribe();

    return channel;
  }
}
