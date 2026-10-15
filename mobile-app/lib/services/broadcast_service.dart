import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'auth_service.dart';

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCY BROADCAST SERVICE (MOBILE)
// Handles authenticated responses to Emergency Broadcast Module (EBM)
// ═══════════════════════════════════════════════════════════════════════════════

class BroadcastService {
  /// Fetches currently active emergency broadcasts from API Gateway
  static Future<List<Map<String, dynamic>>> getActiveAlerts() async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/broadcast/active');
      final res = await http.get(url, headers: {
        'Content-Type': 'application/json',
      }).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['activeBroadcasts'] as List<dynamic>? ?? [];
        return list.map((item) => item as Map<String, dynamic>).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  /// Responds to an emergency broadcast with Bearer token authentication.
  ///
  /// [broadcastId] The ID of the emergency broadcast
  /// [donorDid] The decentralized identifier of the responding donor
  /// [response] 'ACCEPT' or 'DECLINE'
  static Future<Map<String, dynamic>> respondToBroadcast({
    required String broadcastId,
    required String donorDid,
    required String response,
    String? token,
  }) async {
    try {
      // Ensure session token is attached
      final auth = AuthService.instance;
      await auth.ensureAuthenticated();
      final activeToken = token ?? auth.token;

      final url = Uri.parse('${ApiConfig.baseUrl}/broadcast/$broadcastId/respond');
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };

      if (activeToken != null) {
        headers['Authorization'] = 'Bearer $activeToken';
      }

      final res = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'donorDid': donorDid,
          'response': response,
        }),
      );

      final responseBody = jsonDecode(res.body);

      if (res.statusCode == 200 || res.statusCode == 201) {
        return responseBody;
      } else if (res.statusCode == 401) {
        throw Exception('Authentication required: Session expired or invalid token. Please log in with ABHA.');
      } else if (res.statusCode == 409) {
        throw Exception(responseBody['error'] ?? 'You have already responded to this emergency broadcast.');
      } else {
        throw Exception(responseBody['error'] ?? 'Server error ${res.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error while responding to broadcast: $e');
    }
  }
}
