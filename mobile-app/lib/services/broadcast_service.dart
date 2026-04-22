import 'dart:convert';
import 'package:http/http.dart' as http;

class BroadcastService {
  static const String _baseUrl = 'http://10.0.2.2:3001'; // Default for Android emulator to host localhost

  /// Responds to an emergency broadcast.
  /// 
  /// [broadcastId] The ID of the emergency broadcast
  /// [donorDid] The decentralized identifier of the responding donor
  /// [response] 'ACCEPT' or 'DECLINE'
  static Future<Map<String, dynamic>> respondToBroadcast({
    required String broadcastId,
    required String donorDid,
    required String response,
  }) async {
    try {
      final url = Uri.parse('$_baseUrl/broadcast/$broadcastId/respond');
      final res = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'donorDid': donorDid,
          'response': response,
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        return jsonDecode(res.body);
      } else {
        throw Exception('Failed to respond to broadcast: ${res.statusCode} - ${res.body}');
      }
    } catch (e) {
      throw Exception('Network error while responding to broadcast: $e');
    }
  }
}
