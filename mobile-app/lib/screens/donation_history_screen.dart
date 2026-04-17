import 'package:flutter/material.dart';

class DonationHistoryScreen extends StatelessWidget {
  const DonationHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final donations = [
      {
        'id': 'UNIT-X7K2', 'date': 'Jan 15, 2026', 'hospital': 'Apollo Hospital HSR',
        'group': 'O-', 'component': 'Packed RBC', 'volume': '350ml',
        'status': 'TRANSFUSED', 'tokens': 300, 'receipt80g': true,
        'impact': 'Emergency C-section — mother & baby safe',
        'txHash': '0x7a2f...c891',
      },
      {
        'id': 'UNIT-M3P1', 'date': 'Oct 22, 2025', 'hospital': 'Fortis Escorts',
        'group': 'O-', 'component': 'Packed RBC', 'volume': '450ml',
        'status': 'TRANSFUSED', 'tokens': 900, 'receipt80g': true,
        'impact': 'Trauma patient — road accident recovery',
        'txHash': '0x3e1d...ab44',
      },
      {
        'id': 'UNIT-K8R4', 'date': 'Jul 18, 2025', 'hospital': 'AIIMS Delhi',
        'group': 'O-', 'component': 'Platelets', 'volume': '200ml',
        'status': 'TRANSFUSED', 'tokens': 300, 'receipt80g': true,
        'impact': 'Dengue patient — platelet count restored',
        'txHash': '0x9c4b...f023',
      },
      {
        'id': 'UNIT-F2Q7', 'date': 'Apr 12, 2025', 'hospital': 'Manipal Hospital',
        'group': 'O-', 'component': 'Packed RBC', 'volume': '350ml',
        'status': 'TRANSFUSED', 'tokens': 300, 'receipt80g': true,
        'impact': 'Elective surgery — knee replacement',
        'txHash': '0x1f8a...d567',
      },
      {
        'id': 'UNIT-A9W5', 'date': 'Jan 05, 2025', 'hospital': 'Max Saket',
        'group': 'O-', 'component': 'Packed RBC', 'volume': '350ml',
        'status': 'EXPIRED', 'tokens': 300, 'receipt80g': false,
        'impact': 'Unit expired — not transfused',
        'txHash': '0x5d2e...7190',
      },
    ];

    final totalTokens = donations.fold<int>(0, (sum, d) => sum + (d['tokens'] as int));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Donation History'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('🪙', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 4),
                Text('$totalTokens', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFFF59E0B))),
              ],
            ),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: donations.length,
        itemBuilder: (context, index) {
          final d = donations[index];
          final isExpired = d['status'] == 'EXPIRED';
          final isEmergency = (d['tokens'] as int) > 300;

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => _showDetail(context, d),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header row
                    Row(
                      children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: isExpired
                                ? Colors.white.withOpacity(0.06)
                                : const Color(0xFFD90429).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              d['group'] as String,
                              style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w900,
                                color: isExpired ? const Color(0xFF64748B) : const Color(0xFFD90429),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(d['hospital'] as String, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                  if (isEmergency) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEF4444).withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text('⚡ Emergency', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFFEF4444))),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${d['date']} • ${d['component']} • ${d['volume']}',
                                style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.4)),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isExpired
                                    ? const Color(0xFFEF4444).withOpacity(0.12)
                                    : const Color(0xFF10B981).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                d['status'] as String,
                                style: TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.w700,
                                  color: isExpired ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '+${d['tokens']}🪙',
                              style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w700,
                                color: isEmergency ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    if (!isExpired) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.03),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Text('💝', style: TextStyle(fontSize: 14)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                d['impact'] as String,
                                style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.white.withOpacity(0.5)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          'Tx: ${d['txHash']}',
                          style: TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.white.withOpacity(0.25)),
                        ),
                        const Spacer(),
                        if (d['receipt80g'] == true)
                          Row(
                            children: [
                              Icon(Icons.receipt_long_rounded, size: 12, color: const Color(0xFF3B82F6).withOpacity(0.5)),
                              const SizedBox(width: 4),
                              Text('80G Receipt', style: TextStyle(fontSize: 10, color: const Color(0xFF3B82F6).withOpacity(0.5))),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showDetail(BuildContext context, Map<String, dynamic> d) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1F35),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFFD90429), Color(0xFF780000)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(child: Text(d['group'] as String, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white))),
                ),
                const SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(d['id'] as String, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                    Text('${d['component']} • ${d['volume']}', style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.5))),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            _detailRow('Hospital', d['hospital'] as String),
            _detailRow('Date', d['date'] as String),
            _detailRow('Status', d['status'] as String),
            _detailRow('Tokens Earned', '+${d['tokens']}'),
            _detailRow('Tx Hash', d['txHash'] as String),
            _detailRow('FHIR Resource', 'BiologicallyDerivedProduct'),
            const SizedBox(height: 16),
            if (d['receipt80g'] == true)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.download_rounded),
                  label: const Text('Download 80G Receipt (Form 10BE)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 120, child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.4)))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
