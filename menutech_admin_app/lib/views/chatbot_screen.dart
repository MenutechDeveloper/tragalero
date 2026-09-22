import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/supabase_service.dart';
import '../services/tts_service.dart';

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final TextEditingController _inputController = TextEditingController();
  final List<Map<String, String>> _messages = [
    {
      'role': 'bot',
      'text': '¡Hola! Soy tu Asistente IA de Tragalero. Conozco todas las órdenes en tiempo real. ¿En qué te puedo ayudar hoy?'
    }
  ];

  List<OrderModel> _activeOrders = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadActiveOrdersContext();
  }

  Future<void> _loadActiveOrdersContext() async {
    final orders = await SupabaseService.fetchOrders();
    setState(() {
      _activeOrders = orders;
    });
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _inputController.clear();
      _isLoading = true;
    });

    // Generate response using local order context awareness or Edge Function
    final botResponse = await _generateOrderAwareResponse(text);

    setState(() {
      _messages.add({'role': 'bot', 'text': botResponse});
      _isLoading = false;
    });

    TtsService.speakText(botResponse);
  }

  Future<String> _generateOrderAwareResponse(String prompt) async {
    final lower = prompt.toLowerCase();

    if (lower.contains('orden') || lower.contains('pedido') || lower.contains('cliente') || lower.contains('pendiente') || lower.contains('total')) {
      if (_activeOrders.isEmpty) {
        return 'Actualmente no tienes órdenes registradas en tu sistema.';
      }

      final pending = _activeOrders.where((o) => o.status == 'pending').toList();
      final inProcess = _activeOrders.where((o) => o.status == 'accepted' || o.status == 'preparing').toList();

      if (lower.contains('pendiente')) {
        if (pending.isEmpty) return 'No tienes órdenes pendientes en este momento.';
        final first = pending.first;
        final itemsStr = first.items.map((i) => '${i.quantity}x ${i.name}').join(', ');
        return 'Tienes ${pending.length} orden(es) pendiente(s). La última es de ${first.customerName} por \$${first.total.toStringAsFixed(2)} con: $itemsStr.';
      }

      if (lower.contains('proceso') || lower.contains('preparacion') || lower.contains('preparando')) {
        if (inProcess.isEmpty) return 'No tienes órdenes en preparación actualmente.';
        return 'Tienes ${inProcess.length} orden(es) en proceso. Cliente: ${inProcess.first.customerName}.';
      }

      // Default last order info
      final last = _activeOrders.first;
      final itemsStr = last.items.map((i) => '${i.quantity}x ${i.name}').join(', ');
      return 'Tu última orden es #${last.id} de ${last.customerName} por \$${last.total.toStringAsFixed(2)}. Productos: $itemsStr. Estado: ${last.status}.';
    }

    // Call Supabase Edge Function ai-assistant
    try {
      final user = SupabaseService.currentUser;
      if (user != null) {
        final res = await SupabaseService.client.functions.invoke('ai-assistant', body: {
          'user_id': user.id,
          'message': prompt,
        });

        if (res.data != null && res.data['reply'] != null) {
          return res.data['reply'];
        }
      }
    } catch (e) {
      // Fallback
    }

    return '¡Entendido! ¿En qué otra consulta sobre tus órdenes te puedo asistir?';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chatbot IA Tragalero', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Thought Bubble Banner
          Container(
            width: double.infinity,
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              border: Border.all(color: const Color(0xFFFF9533), width: 1.5),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(color: const Color(0xFFFF9533).withOpacity(0.15), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Row(
              children: [
                const Icon(Icons.chat_bubble_outline, color: Color(0xFFFF9533)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _activeOrders.isNotEmpty && _activeOrders.any((o) => o.status == 'pending')
                        ? '¡Tienes ${_activeOrders.where((o) => o.status == "pending").length} nueva(s) orden(es) de Tragalero!'
                        : '¿En qué te puedo colaborar con tus órdenes hoy?',
                    style: const TextStyle(color: Color(0xFF9A3412), fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),

          // Messages
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg['role'] == 'user';

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                    decoration: BoxDecoration(
                      color: isUser ? const Color(0xFFFF9533) : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Text(
                      msg['text'] ?? '',
                      style: TextStyle(color: isUser ? Colors.white : Colors.black87, fontSize: 14),
                    ),
                  ),
                );
              },
            ),
          ),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: CircularProgressIndicator(color: Color(0xFFFF9533)),
            ),

          // Input field
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade300)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    decoration: InputDecoration(
                      hintText: 'Pregúntame sobre tus órdenes...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFFFF9533)),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
