import 'package:flutter/material.dart';

/// ═══════════════════════════════════════════════════════════════════════════════
/// RAKT-CONNECT MOBILE — DISASTER MODE SCREEN
/// "Black Swan Protocol" — Mass Casualty Cell Broadcast & Universal Donor Call
/// Shows disaster alerts, policy overrides, and batch release tracking
/// ═══════════════════════════════════════════════════════════════════════════════

class DisasterModeScreen extends StatefulWidget {
  const DisasterModeScreen({super.key});

  @override
  State<DisasterModeScreen> createState() => _DisasterModeScreenState();
}

class _DisasterModeScreenState extends State<DisasterModeScreen>
    with TickerProviderStateMixin {
  late AnimationController _alertController;
  final bool _disasterActive = true;

  @override
  void initState() {
    super.initState();
    _alertController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _alertController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: CustomScrollView(
        slivers: [
          // Emergency Header
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: const Color(0xFF0A0A0F),
            flexibleSpace: FlexibleSpaceBar(
              background: AnimatedBuilder(
                animation: _alertController,
                builder: (context, child) {
                  return Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Color.lerp(
                              const Color(0xFF991B1B),
                              const Color(0xFFDC2626),
                              _alertController.value)!,
                          const Color(0xFF0A0A0F),
                        ],
                      ),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 40),
                          const Text('⚠️',
                              style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 8),
                          const Text('BLACK SWAN PROTOCOL',
                              style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2,
                                  color: Colors.white)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: _disasterActive
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF10B981),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _disasterActive ? '🔴 ACTIVE' : '🟢 STANDBY',
                              style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Active Disaster Event
                  if (_disasterActive) _buildActiveEvent(),
                  const SizedBox(height: 16),

                  // Cell Broadcast Notice
                  _buildCellBroadcast(),
                  const SizedBox(height: 16),

                  // Policy Overrides
                  _buildPolicyOverrides(),
                  const SizedBox(height: 16),

                  // Donor Action Card
                  _buildDonorAction(),
                  const SizedBox(height: 16),

                  // Batch Releases
                  _buildBatchReleases(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveEvent() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            const Color(0xFFDC2626).withOpacity(0.12),
            const Color(0xFFDC2626).withOpacity(0.04),
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
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDC2626),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('LEVEL 2 — STATE',
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Colors.white)),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('NATURAL DISASTER',
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFF59E0B))),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text('Gujarat Floods — Rajkot District',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 4),
          const Text(
              'Severe flooding in 12 talukas. Multiple casualties. Blood demand surge active.',
              style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 12),
          Row(
            children: [
              _eventStat('Radius', '150 km'),
              _eventStat('Units Dispatched', '84'),
              _eventStat('First Dispatch', '8m 22s ✓'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCellBroadcast() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: const Color(0xFFF59E0B).withOpacity(0.08),
        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.25)),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Text('📡', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('CELL BROADCAST ACTIVE',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFF59E0B))),
                SizedBox(height: 2),
                Text(
                    'Emergency alerts sent via National Disaster Alert system. O- donors prioritized.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyOverrides() {
    final overrides = [
      {'name': '90-Day Gap Bypass', 'status': 'ON', 'critical': true, 'desc': 'O- universal donors'},
      {'name': 'Batch Release', 'status': 'ON', 'critical': true, 'desc': 'No individual cross-match'},
      {'name': 'Cold Chain Relaxation', 'status': 'OFF', 'critical': false, 'desc': 'Safety-critical'},
      {'name': 'Walk-in Donors', 'status': 'ON', 'critical': false, 'desc': 'No pre-registration'},
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
          const Text('⚙️ Active Policy Overrides',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 12),
          ...overrides.map((o) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(10),
                    border: Border(
                        left: BorderSide(
                      color: o['critical'] == true
                          ? const Color(0xFFEF4444)
                          : const Color(0xFF374151),
                      width: 3,
                    )),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(o['name'] as String,
                                style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white)),
                            Text(o['desc'] as String,
                                style: const TextStyle(
                                    fontSize: 11, color: Color(0xFF6B7280))),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: o['status'] == 'ON'
                              ? const Color(0xFF10B981).withOpacity(0.12)
                              : const Color(0xFF6B7280).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(o['status'] as String,
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: o['status'] == 'ON'
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFF6B7280))),
                      ),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildDonorAction() {
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
        children: [
          const Text('🩸 Your blood type is needed!',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Colors.white)),
          const SizedBox(height: 4),
          const Text('As an O- donor, you are eligible for emergency donation',
              style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
              textAlign: TextAlign.center),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.volunteer_activism, color: Colors.white),
                  label: const Text('Respond Now',
                      style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFDC2626),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF4B5563)),
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('📍 Nearest Center',
                    style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Tokens: 3x multiplier during disasters (900 RKT)',
              style: TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildBatchReleases() {
    final batches = [
      {'id': 'BATCH-A4F2', 'units': 24, 'dest': 'Civil Hospital Rajkot', 'time': '14:22', 'status': 'DELIVERED'},
      {'id': 'BATCH-B7M1', 'units': 18, 'dest': 'Wockhardt Emergency', 'time': '15:48', 'status': 'IN_TRANSIT'},
      {'id': 'BATCH-C2H4', 'units': 42, 'dest': 'AIIMS Rajkot (Field)', 'time': '16:30', 'status': 'PENDING'},
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
          const Text('📦 Batch Releases',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 12),
          ...batches.map((b) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Icon(
                      b['status'] == 'DELIVERED'
                          ? Icons.check_circle
                          : b['status'] == 'IN_TRANSIT'
                              ? Icons.local_shipping
                              : Icons.schedule,
                      color: b['status'] == 'DELIVERED'
                          ? const Color(0xFF10B981)
                          : b['status'] == 'IN_TRANSIT'
                              ? const Color(0xFF3B82F6)
                              : const Color(0xFFF59E0B),
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${b['dest']}',
                              style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white)),
                          Text(
                              '${b['id']} • ${b['units']} units • ${b['time']}',
                              style: const TextStyle(
                                  fontSize: 11, color: Color(0xFF6B7280))),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: (b['status'] == 'DELIVERED'
                                ? const Color(0xFF10B981)
                                : b['status'] == 'IN_TRANSIT'
                                    ? const Color(0xFF3B82F6)
                                    : const Color(0xFFF59E0B))
                            .withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                          (b['status'] as String).replaceAll('_', ' '),
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: b['status'] == 'DELIVERED'
                                  ? const Color(0xFF10B981)
                                  : b['status'] == 'IN_TRANSIT'
                                      ? const Color(0xFF3B82F6)
                                      : const Color(0xFFF59E0B))),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _eventStat(String label, String value) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF)),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
