import 'package:flutter_tts/flutter_tts.dart';
import 'package:audioplayers/audioplayers.dart';
import '../models/order.dart';

class TtsService {
  static final FlutterTts _tts = FlutterTts();
  static final AudioPlayer _audioPlayer = AudioPlayer();

  static Future<void> init() async {
    await _tts.setLanguage('es-MX');
    await _tts.setSpeechRate(0.5);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.0);
  }

  /// Triggers Spanish voice synthesis "¡Nueva orden de tragalero!" and sound alert
  static Future<void> speakNewOrder(OrderModel order) async {
    try {
      // Play audio notification
      await _audioPlayer.play(UrlSource('https://menutech.services/assets/audio/notification.mp3'));
    } catch (e) {
      // Audio fallback
    }

    try {
      await _tts.speak('¡Nueva orden de tragalero! Cliente ${order.customerName}. Total: \$${order.total.toStringAsFixed(2)}');
    } catch (e) {
      // TTS fallback
    }
  }

  static Future<void> speakText(String text) async {
    try {
      await _tts.speak(text);
    } catch (e) {
      // Fallback
    }
  }
}
