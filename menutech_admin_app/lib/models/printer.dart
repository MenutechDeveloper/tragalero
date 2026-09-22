class PrinterModel {
  final String id;
  final String userId;
  final String name;
  final String ip;
  final int port;
  final String status;

  PrinterModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.ip,
    this.port = 9100,
    this.status = 'online',
  });

  factory PrinterModel.fromMap(Map<String, dynamic> map) {
    return PrinterModel(
      id: map['id']?.toString() ?? '',
      userId: map['user_id'] ?? '',
      name: map['name'] ?? 'Impresora Principal',
      ip: map['ip'] ?? '192.168.1.200',
      port: map['port'] ?? 9100,
      status: map['status'] ?? 'online',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'ip': ip,
      'port': port,
      'status': status,
    };
  }
}
