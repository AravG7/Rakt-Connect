import 'package:flutter/material.dart';

// ═══════════════════════════════════════════════════════════════════════════════
// QR SCANNER SCREEN
// Bedside Blood Unit Verification + Chain of Custody
// PRD Section 4.2: Scan unit QR → Verify blockchain provenance
// ═══════════════════════════════════════════════════════════════════════════════

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  bool isScanned = false;
  bool isVerifying = false;

  // Mock scanned unit data (would come from blockchain query after QR scan)
  final Map<String, dynamic> scannedUnit = {
    'id': 'UNIT-X7K2',
    'bloodGroup': 'O-',
    'component': 'Packed RBC',
    'volume': '350ml',
    'state': 'RESERVED',
    'donorDid': 'did:rakt:7a92bf01',
    'collectedAt': 'Apr 02, 2026 — 09:14 AM',
    'expiryDate': 'May 14, 2026',
    'daysToExpiry': 28,
    'labResultsHash': '0x9c4b...f023',
    'labSafe': true,
    'lastTemp': '4.1°C',
    'tempCompliant': true,
    'hospitalHfr': 'HFR-KA-0421',
    'qrHash': '0x7a2f8c91d3e4b50a1f6c8d2e9b3a7f4c',
  };

  final List<Map<String, dynamic>> custodyChain = [
    {'state': 'COLLECTED', 'time': 'Apr 02, 09:14', 'actor': 'Tech. Ravi K.', 'icon': Icons.bloodtype_rounded, 'color': Color(0xFFD90429)},
    {'state': 'APPROVED', 'time': 'Apr 02, 14:30', 'actor': 'Lab Tech. Priya M.', 'icon': Icons.science_rounded, 'color': Color(0xFF10B981)},
    {'state': 'STORED', 'time': 'Apr 02, 15:00', 'actor': 'Cold Storage A-2', 'icon': Icons.ac_unit_rounded, 'color': Color(0xFF3B82F6)},
    {'state': 'RESERVED', 'time': 'Apr 15, 11:20', 'actor': 'MatchingContract', 'icon': Icons.bookmark_rounded, 'color': Color(0xFFF59E0B)},
  ];

  void _simulateScan() async {
    setState(() => isVerifying = true);
    await Future.delayed(const Duration(seconds: 2));
    setState(() {
      isVerifying = false;
      isScanned = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Unit Scanner'),
        actions: [
          if (isScanned)
            TextButton.icon(
              onPressed: () => setState(() => isScanned = false),
              icon: const Icon(Icons.qr_code_scanner_rounded, size: 18, color: Color(0xFFD90429)),
              label: const Text('New Scan', style: TextStyle(color: Color(0xFFD90429), fontWeight: FontWeight.w700)),
            ),
        ],
      ),
      body: isScanned ? _buildResultView() : _buildScannerView(),
    );
  }

  Widget _buildScannerView() {
    return Column(
      children: [
        // Camera viewfinder placeholder
        Expanded(
          flex: 3,
          child: Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Scan crosshair
                Container(
                  width: 220, height: 220,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFD90429).withValues(alpha: 0.5), width: 2),
                  ),
                ),
                // Corner accents
                Positioned(top: 0, left: 0, child: _cornerDecor(true, true)),
                Positioned(top: 0, right: 0, child: _cornerDecor(true, false)),
                Positioned(bottom: 0, left: 0, child: _cornerDecor(false, true)),
                Positioned(bottom: 0, right: 0, child: _cornerDecor(false, false)),

                if (isVerifying)
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(color: Color(0xFFD90429)),
                      const SizedBox(height: 16),
                      Text('Verifying on Blockchain...', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.7))),
                    ],
                  ),

                if (!isVerifying)
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.qr_code_scanner_rounded, size: 64, color: Colors.white.withValues(alpha: 0.15)),
                      const SizedBox(height: 12),
                      Text('Point camera at blood unit QR code', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.4))),
                    ],
                  ),
              ],
            ),
          ),
        ),

        // Buttons
        Expanded(
          flex: 1,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: isVerifying ? null : _simulateScan,
                    icon: const Icon(Icons.qr_code_scanner_rounded),
                    label: Text(isVerifying ? 'Verifying...' : 'Simulate Scan', style: const TextStyle(fontWeight: FontWeight.w700)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD90429),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Scan verifies: Blood group • Lab results • Cold chain • Expiry • Chain of custody',
                  style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.3), height: 1.4),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _cornerDecor(bool top, bool left) {
    return SizedBox(
      width: 220, height: 220,
      child: CustomPaint(painter: _CornerPainter(top: top, left: left)),
    );
  }

  Widget _buildResultView() {
    final unit = scannedUnit;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Verification Status
          Card(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: LinearGradient(colors: [const Color(0xFF10B981).withValues(alpha: 0.08), const Color(0xFF10B981).withValues(alpha: 0.02)]),
              ),
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 28),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('✅ BLOCKCHAIN VERIFIED', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                        SizedBox(height: 2),
                        Text('All checks passed — safe for transfusion', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Unit Info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 56, height: 56,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFFD90429), Color(0xFF780000)]),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(child: Text(unit['bloodGroup'], style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white))),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(unit['id'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                            Text('${unit['component']} • ${unit['volume']}', style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.5))),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(unit['state'], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFF59E0B))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _infoRow('Collected', unit['collectedAt']),
                  _infoRow('Expiry', '${unit['expiryDate']} (${unit['daysToExpiry']}d left)'),
                  _infoRow('Lab Results', unit['labSafe'] ? '✅ NEGATIVE (all markers)' : '⚠️ POSITIVE'),
                  _infoRow('Temperature', '${unit['lastTemp']} ${unit['tempCompliant'] ? "✅ (2-6°C)" : "⚠️ BREACH"}'),
                  _infoRow('Donor DID', unit['donorDid']),
                  _infoRow('QR Hash', unit['qrHash']),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Chain of Custody
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text('Chain of Custody', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD90429).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text('${custodyChain.length} tx', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD90429))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ...custodyChain.asMap().entries.map((entry) {
                    final i = entry.key;
                    final step = entry.value;
                    final isLast = i == custodyChain.length - 1;

                    return IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 32,
                            child: Column(
                              children: [
                                Container(
                                  width: 28, height: 28,
                                  decoration: BoxDecoration(
                                    color: (step['color'] as Color).withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(step['icon'] as IconData, size: 16, color: step['color'] as Color),
                                ),
                                if (!isLast) Expanded(child: Container(width: 2, color: Colors.white.withValues(alpha: 0.06))),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(step['state'], style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: step['color'] as Color)),
                                  Text('${step['time']} • ${step['actor']}', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.4))),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.4))),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'monospace')),
          ),
        ],
      ),
    );
  }
}

class _CornerPainter extends CustomPainter {
  final bool top;
  final bool left;
  _CornerPainter({required this.top, required this.left});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFD90429)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const len = 30.0;
    final x = left ? 0.0 : size.width;
    final y = top ? 0.0 : size.height;
    final dx = left ? len : -len;
    final dy = top ? len : -len;

    canvas.drawLine(Offset(x, y), Offset(x + dx, y), paint);
    canvas.drawLine(Offset(x, y), Offset(x, y + dy), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
