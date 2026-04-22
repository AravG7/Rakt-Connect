import 'package:flutter/material.dart';
import '../services/broadcast_service.dart';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  bool hasActiveAlert = true;
  bool _isLoading = false;

  final List<Map<String, dynamic>> alerts = [
    {
      'id': 'EBM-A4F2K1',
      'hospital': 'Apollo Hospital HSR',
      'distance': '4.2 km',
      'eta': '18 min',
      'bloodGroup': 'O-',
      'severity': 'CRITICAL',
      'unitsNeeded': 3,
      'accepted': 2,
      'target': 5,
      'time': '12 min ago',
      'channels': ['WhatsApp', 'Push', 'IVR'],
    },
    {
      'id': 'EBM-B8G3M2',
      'hospital': 'Manipal Hospital',
      'distance': '8.1 km',
      'eta': '28 min',
      'bloodGroup': 'B-',
      'severity': 'HIGH',
      'unitsNeeded': 2,
      'accepted': 1,
      'target': 3,
      'time': '45 min ago',
      'channels': ['WhatsApp', 'SMS'],
    },
  ];

  final List<Map<String, dynamic>> pastResponses = [
    {'date': 'Apr 10', 'hospital': 'Fortis Escorts', 'group': 'O-', 'status': 'Donated', 'tokens': 900},
    {'date': 'Feb 28', 'hospital': 'AIIMS', 'group': 'O-', 'status': 'Donated', 'tokens': 900},
    {'date': 'Dec 15', 'hospital': 'Apollo HSR', 'group': 'O-', 'status': 'Declined', 'tokens': 0},
  ];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _respondToAlert(String broadcastId, String responseType) async {
    setState(() => _isLoading = true);
    try {
      // Hardcoded donor DID for demo purposes
      final donorDid = 'did:rakt:donor:001';
      final res = await BroadcastService.respondToBroadcast(
        broadcastId: broadcastId,
        donorDid: donorDid,
        response: responseType,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Response sent successfully: ${res['message'] ?? 'Thanks!'}'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Remove the alert from the UI
      setState(() {
        alerts.removeWhere((a) => a['id'] == broadcastId);
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to send response. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency Alerts'),
        actions: [
          AnimatedBuilder(
            animation: _animController,
            builder: (context, child) => Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Color.lerp(const Color(0xFFEF4444).withValues(alpha: 0.1), const Color(0xFFEF4444).withValues(alpha: 0.25), _animController.value),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: const Color(0xFFEF4444).withValues(alpha: 0.5 * _animController.value), blurRadius: 6)],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text('${alerts.length} Active', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFEF4444))),
                ],
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Active Alerts
            ...alerts.map((alert) => _buildAlertCard(alert)),

            const SizedBox(height: 24),
            Text('Your Response History', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.5))),
            const SizedBox(height: 12),

            // Past responses
            ...pastResponses.map((r) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: r['status'] == 'Donated'
                        ? const Color(0xFF10B981).withValues(alpha: 0.12)
                        : const Color(0xFF64748B).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    r['status'] == 'Donated' ? Icons.check_circle_rounded : Icons.cancel_rounded,
                    color: r['status'] == 'Donated' ? const Color(0xFF10B981) : const Color(0xFF64748B),
                  ),
                ),
                title: Text(r['hospital'], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                subtitle: Text('${r['date']} • ${r['group']} • ${r['status']}', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4))),
                trailing: r['tokens'] > 0
                    ? Text('+${r['tokens']}🪙', style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFF59E0B)))
                    : null,
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertCard(Map<String, dynamic> alert) {
    final isCritical = alert['severity'] == 'CRITICAL';

    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isCritical
                ? [const Color(0xFFEF4444).withValues(alpha: 0.12), const Color(0xFF780000).withValues(alpha: 0.15)]
                : [const Color(0xFFF59E0B).withValues(alpha: 0.08), const Color(0xFFF59E0B).withValues(alpha: 0.04)],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isCritical
                ? Color.lerp(const Color(0xFFEF4444).withValues(alpha: 0.2), const Color(0xFFEF4444).withValues(alpha: 0.5), _animController.value)!
                : const Color(0xFFF59E0B).withValues(alpha: 0.2),
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  isCritical ? Icons.emergency_rounded : Icons.warning_amber_rounded,
                  color: isCritical ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                  size: 28,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(alert['hospital'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                      Text('${alert['distance']} • ETA ${alert['eta']}', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isCritical ? const Color(0xFFEF4444).withValues(alpha: 0.15) : const Color(0xFFF59E0B).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    alert['bloodGroup'],
                    style: TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w900,
                      color: isCritical ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Progress
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${alert['accepted']} / ${alert['target']} donors accepted',
                        style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5)),
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: (alert['accepted'] as int) / (alert['target'] as int),
                          backgroundColor: Colors.white.withValues(alpha: 0.06),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            isCritical ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                          ),
                          minHeight: 6,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Text(alert['time'], style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.3))),
              ],
            ),
            const SizedBox(height: 14),

            // Channels
            Row(
              children: [
                ...(alert['channels'] as List).map((ch) => Container(
                  margin: const EdgeInsets.only(right: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(ch, style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.5))),
                )),
                const Spacer(),
                Text('3x Rakt-Tokens', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFFF59E0B).withValues(alpha: 0.7))),
              ],
            ),
            const SizedBox(height: 14),

            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : () => _respondToAlert(alert['id'], 'DECLINE'),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Decline', style: TextStyle(color: Colors.white54)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: _isLoading ? null : () => _respondToAlert(alert['id'], 'ACCEPT'),
                    icon: _isLoading 
                        ? const SizedBox(
                            width: 18, 
                            height: 18, 
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                          )
                        : const Icon(Icons.navigation_rounded, size: 18),
                    label: Text(_isLoading ? 'Processing...' : 'Accept & Navigate', style: const TextStyle(fontWeight: FontWeight.w700)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isCritical ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
