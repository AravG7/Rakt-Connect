import 'package:flutter/material.dart';

/// ═══════════════════════════════════════════════════════════════════════════════
/// RAKT-CONNECT MOBILE — HCX GATEWAY SCREEN
/// "HCX Gateway" — Insurance Claim Tracking & Zero-Copay Status
/// Patient-facing view of claim status, settlement, and financial transparency
/// ═══════════════════════════════════════════════════════════════════════════════

class HCXGatewayScreen extends StatelessWidget {
  const HCXGatewayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('💳 Insurance Claims',
            style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Zero Copay Banner
            _buildZeroCopayBanner(),
            const SizedBox(height: 16),

            // Active Claim Card
            _buildActiveClaim(),
            const SizedBox(height: 16),

            // Settlement Status
            _buildSettlementPipeline(),
            const SizedBox(height: 16),

            // Past Claims
            _buildPastClaims(),
            const SizedBox(height: 16),

            // FHIR Compliance
            _buildFHIRInfo(),
          ],
        ),
      ),
    );
  }

  Widget _buildZeroCopayBanner() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            const Color(0xFF10B981).withOpacity(0.15),
            const Color(0xFF10B981).withOpacity(0.05),
          ],
        ),
        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text('🎯', style: TextStyle(fontSize: 28)),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Zero Out-of-Pocket',
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF10B981))),
                SizedBox(height: 2),
                Text(
                    'All your blood transfusions are auto-covered by insurance. No copay needed.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
              ],
            ),
          ),
          const Column(
            children: [
              Text('₹0',
                  style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF10B981))),
              Text('Your copay',
                  style: TextStyle(fontSize: 10, color: Color(0xFF6B7280))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActiveClaim() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111118),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('Active Claim',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Colors.white)),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('⏳ PROCESSING',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF3B82F6))),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _claimRow('Claim ID', 'CLM-A4F2K100'),
          _claimRow('Blood Unit', 'UNIT-X7K2'),
          _claimRow('Hospital', 'Apollo HSR, Bangalore'),
          _claimRow('Procedure', 'Emergency Transfusion'),
          _claimRow('Insurer', 'PM-JAY (Ayushman Bharat)'),
          _claimRow('Amount', '₹8,500'),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withOpacity(0.06),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified, color: Color(0xFF3B82F6), size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Auto-Adjudication Complete',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF3B82F6))),
                      Text(
                          'Blockchain verified ✓ | Fraud score: 0 | Medical necessity confirmed',
                          style: TextStyle(
                              fontSize: 11, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettlementPipeline() {
    final steps = [
      {'label': 'Submitted', 'done': true, 'time': '10:22 AM'},
      {'label': 'Verified on Chain', 'done': true, 'time': '10:22 AM'},
      {'label': 'Auto-Adjudicated', 'done': true, 'time': '10:22 AM'},
      {'label': 'Approved', 'done': true, 'time': '10:23 AM'},
      {'label': 'Settlement', 'done': false, 'time': 'Processing...'},
    ];

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111118),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Settlement Pipeline',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 4),
          const Text('Approval time: 3.2s (KPI: < 10 min ✓)',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF10B981))),
          const SizedBox(height: 14),
          ...steps.asMap().entries.map((entry) {
            final i = entry.key;
            final step = entry.value;
            final isDone = step['done'] as bool;
            final isLast = i == steps.length - 1;

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: isDone
                            ? const Color(0xFF10B981)
                            : isLast
                                ? const Color(0xFF3B82F6)
                                : const Color(0xFF374151),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isDone ? Icons.check : Icons.schedule,
                        size: 14,
                        color: Colors.white,
                      ),
                    ),
                    if (i < steps.length - 1)
                      Container(
                        width: 2,
                        height: 28,
                        color: isDone
                            ? const Color(0xFF10B981).withOpacity(0.4)
                            : const Color(0xFF374151),
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        Text(step['label'] as String,
                            style: TextStyle(
                                fontSize: 14,
                                fontWeight:
                                    isDone ? FontWeight.w700 : FontWeight.w500,
                                color: isDone
                                    ? Colors.white
                                    : const Color(0xFF6B7280))),
                        const Spacer(),
                        Text(step['time'] as String,
                            style: TextStyle(
                                fontSize: 11,
                                color: isDone
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFF6B7280))),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF8B5CF6).withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Text('🏦', style: TextStyle(fontSize: 16)),
                SizedBox(width: 8),
                Text('Settlement via: PM-JAY Direct → e-Rupee (CBDC)',
                    style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9CA3AF),
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPastClaims() {
    final claims = [
      {'id': 'CLM-B8G3M200', 'amount': '₹12,000', 'status': 'SETTLED', 'method': 'UPI Health', 'date': '12 Mar'},
      {'id': 'CLM-C2H4N300', 'amount': '₹6,200', 'status': 'SETTLED', 'method': 'PM-JAY', 'date': '28 Jan'},
    ];

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111118),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Past Claims',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 12),
          ...claims.map((c) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(10),
                  border: const Border(
                      left: BorderSide(color: Color(0xFF10B981), width: 3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle,
                        color: Color(0xFF10B981), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c['amount']!,
                              style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white)),
                          Text('${c['id']} • ${c['method']} • ${c['date']}',
                              style: const TextStyle(
                                  fontSize: 11, color: Color(0xFF6B7280))),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('₹0 copay',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF10B981))),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildFHIRInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF3B82F6).withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.15)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline, size: 16, color: Color(0xFF9CA3AF)),
          SizedBox(width: 8),
          Expanded(
            child: Text(
                'Claims follow HL7 FHIR R4 (Claim + ClaimResponse). Connected to NHCX sandbox for PM-JAY and private insurers.',
                style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
          ),
        ],
      ),
    );
  }

  Widget _claimRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
