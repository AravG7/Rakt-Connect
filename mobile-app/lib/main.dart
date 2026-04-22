import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/dashboard_screen.dart';
import 'screens/emergency_screen.dart';
import 'screens/donation_history_screen.dart';
import 'screens/qr_scanner_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/rare_registry_screen.dart';
import 'screens/disaster_mode_screen.dart';
import 'screens/hcx_gateway_screen.dart';

// ═══════════════════════════════════════════════════════════════════════════════
// RAKT-CONNECT MOBILE APP v2.5
// Donor-Facing & Bedside Scanner Application
// PRD Section 10, Step 6 + Specialized Modules (PRD v1.5)
// ═══════════════════════════════════════════════════════════════════════════════

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const RaktConnectApp());
}

class RaktConnectApp extends StatelessWidget {
  const RaktConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rakt-Connect',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFFD90429),
          secondary: const Color(0xFFE63946),
          surface: const Color(0xFF1A1F35),
          error: const Color(0xFFEF4444),
          onPrimary: Colors.white,
          onSurface: const Color(0xFFF1F5F9),
          outline: Colors.white.withValues(alpha: 0.06),
        ),
        scaffoldBackgroundColor: const Color(0xFF0A0E1A),
        fontFamily: 'Inter',
        cardTheme: CardThemeData(
          color: const Color(0xFF1A1F35),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF111827),
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF111827),
          selectedItemColor: Color(0xFFD90429),
          unselectedItemColor: Color(0xFF64748B),
          type: BottomNavigationBarType.fixed,
          showUnselectedLabels: true,
          selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
          unselectedLabelStyle: TextStyle(fontSize: 11),
        ),
      ),
      home: const MainNavigation(),
      routes: {
        '/rare-registry': (context) => const RareRegistryScreen(),
        '/disaster-mode': (context) => const DisasterModeScreen(),
        '/hcx-gateway': (context) => const HCXGatewayScreen(),
      },
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    EmergencyScreen(),
    QRScannerScreen(),
    DonationHistoryScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.emergency_rounded), label: 'Emergency'),
            BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner_rounded), label: 'Scan'),
            BottomNavigationBarItem(icon: Icon(Icons.history_rounded), label: 'History'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}
