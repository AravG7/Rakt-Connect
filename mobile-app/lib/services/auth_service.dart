import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION & SESSION SERVICE
// ABHA OTP Flow, JWT Token Management & RBAC Headers
// ═══════════════════════════════════════════════════════════════════════════════

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  static AuthService get instance => _instance;

  String? _token;
  String? _donorDid = 'did:rakt:7a92bf01';
  String? _abhaId = '91-8842-1944-4821';
  String? _name = 'Rajesh K.';
  String _role = 'DONOR';

  String? get token => _token;
  String get donorDid => _donorDid ?? 'did:rakt:7a92bf01';
  String get abhaId => _abhaId ?? '91-8842-1944-4821';
  String get name => _name ?? 'Rajesh K.';
  String get userName => name;
  String get role => _role;
  bool get isAuthenticated => _token != null;

  void setSession({
    required String token,
    required String role,
    String? did,
    String? abhaId,
    String? name,
  }) {
    _token = token;
    _role = role;
    if (did != null) _donorDid = did;
    if (abhaId != null) _abhaId = abhaId;
    if (name != null) _name = name;
  }

  void logout() {
    _token = null;
    _donorDid = 'did:rakt:7a92bf01';
    _abhaId = '91-8842-1944-4821';
    _role = 'DONOR';
  }

  /// Initiates ABHA authentication (dispatches OTP)
  Future<Map<String, dynamic>> initiateAbhaLogin(String abhaId) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/auth/abha-login');
    final res = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'abhaId': abhaId}),
    );

    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      return data;
    } else {
      throw Exception(data['error'] ?? 'Failed to request OTP: HTTP ${res.statusCode}');
    }
  }

  /// Verifies OTP and secures session JWT token
  Future<Map<String, dynamic>> verifyOtp(String abhaId, String otp) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/auth/verify-otp');
    final res = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'abhaId': abhaId,
        'otp': otp,
      }),
    );

    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      setSession(
        token: data['token'],
        role: data['role'] ?? 'DONOR',
        did: data['did'],
        abhaId: abhaId,
        name: 'Donor ${abhaId.length >= 4 ? abhaId.substring(abhaId.length - 4) : abhaId}',
      );
      return data;
    } else {
      throw Exception(data['error'] ?? 'OTP verification failed: HTTP ${res.statusCode}');
    }
  }

  /// Developer / sandbox login with custom credentials
  Future<void> loginDevDonor([String? did, String? name]) async {
    if (did != null && did.isNotEmpty) _donorDid = did;
    if (name != null && name.isNotEmpty) _name = name;
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/auth/login');
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'role': 'DONOR',
          'abhaId': _abhaId ?? '91-8842-1944-4821',
          'userId': _donorDid ?? 'did:rakt:7a92bf01',
          'name': _name ?? 'Rajesh K.'
        }),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _token = data['token'];
        _role = data['role'] ?? 'DONOR';
        return;
      }
    } catch (_) {}
    _token = 'dev-donor-token-${DateTime.now().millisecondsSinceEpoch}';
  }

  /// Quick developer login for testing
  Future<void> ensureAuthenticated() async {
    if (_token != null) return;
    await loginDevDonor();
  }
}
