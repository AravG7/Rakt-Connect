import 'package:flutter/material.dart';

/// ═══════════════════════════════════════════════════════════════════════════════
/// RAKT-CONNECT MOBILE — RARE REGISTRY SCREEN
/// "The Rare Registry" — Bombay Blood Group & Phenotype Module
/// For rare donors: Elite status, health benefits, national search notifications
/// ═══════════════════════════════════════════════════════════════════════════════

class RareRegistryScreen extends StatefulWidget {
  const RareRegistryScreen({super.key});

  @override
  State<RareRegistryScreen> createState() => _RareRegistryScreenState();
}

class _RareRegistryScreenState extends State<RareRegistryScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('🧬 Rare Registry',
            style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Elite Status Card
            _buildEliteStatusCard(),
            const SizedBox(height: 16),

            // Active Search Notification
            _buildActiveSearchAlert(),
            const SizedBox(height: 16),

            // Phenotype Profile
            _buildPhenotypeProfile(),
            const SizedBox(height: 16),

            // Health Benefits
            _buildHealthBenefits(),
            const SizedBox(height: 16),

            // Search History
            _buildSearchHistory(),
          ],
        ),
      ),
    );
  }

  Widget _buildEliteStatusCard() {
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              colors: [
                const Color(0xFF6D28D9).withOpacity(0.3 + _pulseController.value * 0.1),
                const Color(0xFF4C1D95).withOpacity(0.2),
              ],
            ),
            border: Border.all(color: const Color(0xFF7C3AED).withOpacity(0.4)),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7C3AED).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Text('🧬', style: TextStyle(fontSize: 28)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text('ELITE RARE DONOR',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFFA78BFA),
                                    letterSpacing: 1)),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF7C3AED),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text('🏅 VERIFIED',
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text('Bombay Blood Group (hh)',
                            style: TextStyle(
                                fontSize: 14, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _statItem('Donations', '6', const Color(0xFFA78BFA)),
                    _divider(),
                    _statItem('Lives Saved', '18', const Color(0xFF10B981)),
                    _divider(),
                    _statItem('Prevalence', '1:10K', const Color(0xFFF59E0B)),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActiveSearchAlert() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            const Color(0xFFDC2626).withOpacity(0.15),
            const Color(0xFFDC2626).withOpacity(0.05),
          ],
        ),
        border: Border.all(color: const Color(0xFFDC2626).withOpacity(0.3)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                        color: const Color(0xFFEF4444).withOpacity(0.5),
                        blurRadius: 8)
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Text('ACTIVE NATIONAL SEARCH',
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFFEF4444),
                      letterSpacing: 0.5)),
              const Spacer(),
              const Text('8 min ago',
                  style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
            ],
          ),
          const SizedBox(height: 12),
          const Text('AIIMS Delhi needs Bombay (hh) — CRITICAL',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white)),
          const SizedBox(height: 4),
          const Text(
              'A patient requires 2 units of hh-phenotype blood. You are 1 of 3 matched donors.',
              style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 12),
          Row(
            children: [
              _infoChip('Genetic Match: 90%', const Color(0xFF10B981)),
              const SizedBox(width: 8),
              _infoChip('ETA: 4h Air ✈️', const Color(0xFF3B82F6)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFDC2626),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('🔐 Give Consent',
                      style: TextStyle(
                          fontWeight: FontWeight.w800, color: Colors.white)),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF4B5563)),
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Details',
                    style: TextStyle(color: Color(0xFF9CA3AF))),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPhenotypeProfile() {
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
          const Text('Extended Phenotype Profile',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 4),
          const Text('FHIR R4: Observation.component',
              style: TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
          const SizedBox(height: 14),
          _phenotypeRow('Base Group', 'O- (hh Bombay)', const Color(0xFFEF4444)),
          _phenotypeRow('Kell', 'K- (Negative)', const Color(0xFF3B82F6)),
          _phenotypeRow('Duffy', 'Fy(a-b-) — Null', const Color(0xFFF59E0B)),
          _phenotypeRow('Kidd', 'Jk(a+b-)', const Color(0xFF10B981)),
          _phenotypeRow('MNS', 'M+N-S-s+', const Color(0xFF8B5CF6)),
          _phenotypeRow('Lewis', 'Le(a-b+)', const Color(0xFF06B6D4)),
        ],
      ),
    );
  }

  Widget _buildHealthBenefits() {
    final benefits = [
      {'icon': '🏥', 'title': 'Annual Health Screening', 'desc': 'Comprehensive checkup at NABH hospitals'},
      {'icon': '⚕️', 'title': 'Priority OPD Access', 'desc': 'Skip queues at all partnered hospitals'},
      {'icon': '✈️', 'title': 'Air-Medical Transport', 'desc': 'Emergency air-courier coverage included'},
      {'icon': '🛡️', 'title': '₹5L Life Insurance', 'desc': 'Government-backed life coverage'},
      {'icon': '📞', 'title': 'NBTC Direct Hotline', 'desc': 'Priority access to national coordinator'},
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
          const Text('🏅 Elite Benefits',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 12),
          ...benefits.map((b) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED).withOpacity(0.06),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: const Color(0xFF7C3AED).withOpacity(0.12)),
                  ),
                  child: Row(
                    children: [
                      Text(b['icon']!, style: const TextStyle(fontSize: 22)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(b['title']!,
                                style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white)),
                            Text(b['desc']!,
                                style: const TextStyle(
                                    fontSize: 12, color: Color(0xFF9CA3AF))),
                          ],
                        ),
                      ),
                      const Icon(Icons.check_circle,
                          color: Color(0xFF10B981), size: 18),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildSearchHistory() {
    final searches = [
      {'hospital': 'CMC Vellore', 'status': 'FULFILLED', 'time': '3 months ago', 'tokens': '+900'},
      {'hospital': 'AIIMS Delhi', 'status': 'EXPIRED', 'time': '6 months ago', 'tokens': '-'},
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
          const Text('Search Match History',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 12),
          ...searches.map((s) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Icon(
                      s['status'] == 'FULFILLED' ? Icons.check_circle : Icons.cancel,
                      color: s['status'] == 'FULFILLED'
                          ? const Color(0xFF10B981)
                          : const Color(0xFF6B7280),
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s['hospital']!,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white)),
                          Text('${s['status']} • ${s['time']}',
                              style: const TextStyle(
                                  fontSize: 11, color: Color(0xFF6B7280))),
                        ],
                      ),
                    ),
                    if (s['tokens'] != '-')
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text('${s['tokens']} RKT',
                            style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF10B981))),
                      ),
                  ],
                ),
              )),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF7C3AED).withOpacity(0.06),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Icon(Icons.lock, size: 14, color: Color(0xFF9CA3AF)),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                      'Your identity stays anonymized until you give bilateral consent. DPDP Act 2023 compliant.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 20, fontWeight: FontWeight.w900, color: color)),
        const SizedBox(height: 2),
        Text(label,
            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
      ],
    );
  }

  Widget _divider() {
    return Container(
        width: 1, height: 30, color: Colors.white.withOpacity(0.1));
  }

  Widget _phenotypeRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
              width: 4,
              height: 24,
              decoration: BoxDecoration(
                  color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 10),
          Text(label,
              style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF9CA3AF),
                  fontWeight: FontWeight.w600)),
          const Spacer(),
          Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Colors.white)),
        ],
      ),
    );
  }

  Widget _infoChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Text(text,
          style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w700, color: color)),
    );
  }
}
