import 'dart:convert';

class OrderItem {
  final String name;
  final double price;
  final double total;
  final int quantity;
  final String? size;
  final List<String> toppings;
  final String? instructions;

  OrderItem({
    required this.name,
    required this.price,
    required this.total,
    required this.quantity,
    this.size,
    this.toppings = const [],
    this.instructions,
  });

  factory OrderItem.fromMap(Map<String, dynamic> map) {
    return OrderItem(
      name: map['name'] ?? 'Platillo',
      price: (map['price'] ?? 0).toDouble(),
      total: (map['total'] ?? (map['price'] ?? 0) * (map['quantity'] ?? 1)).toDouble(),
      quantity: map['quantity'] ?? 1,
      size: map['size'],
      toppings: List<String>.from(map['toppings'] ?? []),
      instructions: map['instructions'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'price': price,
      'total': total,
      'quantity': quantity,
      'size': size,
      'toppings': toppings,
      'instructions': instructions,
    };
  }
}

class OrderModel {
  final dynamic id;
  final String userId;
  final String customerName;
  final String customerPhone;
  final String address;
  final String orderType;
  final String? reference;
  final String? paymentMethod;
  final List<OrderItem> items;
  final double total;
  final String status; // pending, accepted, preparing, finished, delivered, rejected
  final DateTime createdAt;

  OrderModel({
    required this.id,
    required this.userId,
    required this.customerName,
    required this.customerPhone,
    required this.address,
    required this.orderType,
    this.reference,
    this.paymentMethod,
    required this.items,
    required this.total,
    required this.status,
    required this.createdAt,
  });

  factory OrderModel.fromMap(Map<String, dynamic> map) {
    List<OrderItem> parsedItems = [];
    if (map['items'] != null) {
      final itemsData = map['items'] is String
          ? json.decode(map['items'])
          : map['items'];
      if (itemsData is List) {
        parsedItems = itemsData.map((i) => OrderItem.fromMap(i)).toList();
      }
    }

    return OrderModel(
      id: map['id'],
      userId: map['user_id'] ?? '',
      customerName: map['customer_name'] ?? map['client_name'] ?? 'Cliente',
      customerPhone: map['customer_phone'] ?? map['client_phone'] ?? '',
      address: map['address'] ?? map['client_address'] ?? '',
      orderType: map['order_type'] ?? 'pickup',
      reference: map['reference'],
      paymentMethod: map['payment_method'],
      items: parsedItems,
      total: (map['total'] ?? map['total_amount'] ?? 0).toDouble(),
      status: map['status'] ?? 'pending',
      createdAt: map['created_at'] != null
          ? DateTime.parse(map['created_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'user_id': userId,
      'customer_name': customerName,
      'customer_phone': customerPhone,
      'address': address,
      'order_type': orderType,
      'reference': reference,
      'payment_method': paymentMethod,
      'items': items.map((i) => i.toMap()).toList(),
      'total': total,
      'status': status,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
