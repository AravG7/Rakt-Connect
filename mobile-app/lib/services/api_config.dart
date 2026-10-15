import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

// ═══════════════════════════════════════════════════════════════════════════════
// RAKT-CONNECT MOBILE API CONFIGURATION
// Configurable Gateway endpoint supporting Emulator, Physical Device, and Production
// ═══════════════════════════════════════════════════════════════════════════════

class ApiConfig {
  // Allow overriding via Flutter compile-time define:
  // flutter run --dart-define=API_URL=https://api.raktconnect.org
  static const String _envUrl = String.fromEnvironment('API_URL');

  // Dynamic user override (can be changed in settings)
  static String? _customBaseUrl;

  /// Returns the active API Gateway base URL
  static String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }

    if (_envUrl.isNotEmpty) {
      return _envUrl;
    }

    // Platform-aware defaults:
    if (kIsWeb) {
      return 'http://localhost:3001';
    }

    try {
      if (Platform.isAndroid) {
        // Android emulator maps 10.0.2.2 to host machine's localhost
        return 'http://10.0.2.2:3001';
      } else if (Platform.isIOS || Platform.isMacOS) {
        // iOS simulator connects directly to localhost
        return 'http://localhost:3001';
      } else {
        return 'http://localhost:3001';
      }
    } catch (_) {
      return 'http://10.0.2.2:3001';
    }
  }

  /// Sets custom API base URL for physical phone testing (e.g. http://192.168.1.50:3001)
  static void setCustomBaseUrl(String url) {
    _customBaseUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
  }

  /// Alias for setCustomBaseUrl
  static void setBaseUrl(String url) => setCustomBaseUrl(url);

  /// Reset to platform default
  static void resetDefault() {
    _customBaseUrl = null;
  }

  /// Alias for resetDefault
  static void resetToDefault() => resetDefault();

  /// Check if active endpoint uses secure TLS/HTTPS
  static bool get isHttps => baseUrl.startsWith('https://');
}
