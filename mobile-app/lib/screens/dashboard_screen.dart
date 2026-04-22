import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with TickerProviderStateMixin {
  final String donorDid = "did:rakt:7a92bf01";
  final String donorName = "Rajesh K.";
  final String bloodGroup = "O-";
  final int raktTokens = 2400;
  final int totalDonations = 8;
  final String tier = "Golden";
  final bool isEligible = true;
  final String nextEligible = "Apr 15, 2026";
  final int livesSaved = 24;

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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFD90429), Color(0xFF780000)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(child: Text('🩸', style: TextStyle(fontSize: 16))),
            ),
            const SizedBox(width: 10),
            const Text('Rakt-Connect'),
          ],
        ),
        actions: [
          IconButton(
            icon: AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) => Icon(
                Icons.notifications_active_rounded,
                color: Color.lerp(Colors.white54, const Color(0xFFEF4444), _pulseController.value),
              ),
            ),
            onPressed: _showEmergencyAlert,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Donor Card with DID + QR
            _buildDonorCard(theme),
            const SizedBox(height: 16),

            // Stats Row
            Row(
              children: [
                Expanded(child: _buildStatCard('🪙', '$raktTokens', 'Rakt-Tokens', const Color(0xFFF59E0B))),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('❤️', '$totalDonations', 'Donations', const Color(0xFFEF4444))),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('🫀', '$livesSaved', 'Lives Saved', const Color(0xFF10B981))),
              ],
            ),
            const SizedBox(height: 16),

            // Eligibility Card
            _buildEligibilityCard(theme),
            const SizedBox(height: 16),

            // Tier Progress
            _buildTierCard(theme),
            const SizedBox(height: 16),

            // Impact Story
            _buildImpactStory(theme),
            const SizedBox(height: 16),

            // Quick Actions
            _buildQuickActions(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildDonorCard(ThemeData theme) {
    return Card(
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
                  child: Center(
                    child: Text(bloodGroup, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white)),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(donorName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 2),
                      Text(donorDid, style: TextStyle(fontSize: 12, color: theme.colorScheme.primary, fontFamily: 'monospace')),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('🏅 $tier', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFF59E0B))),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // QR Code
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: QrImageView(
                data: donorDid,
                version: QrVersions.auto,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: Color(0xFFD90429),
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: Color(0xFFD90429),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text('Bedside Scan QR', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String emoji, String value, String label, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.5))),
          ],
        ),
      ),
    );
  }

  Widget _buildEligibilityCard(ThemeData theme) {
    return Card(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: isEligible
              ? LinearGradient(colors: [const Color(0xFF10B981).withValues(alpha: 0.08), const Color(0xFF10B981).withValues(alpha: 0.02)])
              : LinearGradient(colors: [const Color(0xFFF59E0B).withValues(alpha: 0.08), const Color(0xFFF59E0B).withValues(alpha: 0.02)]),
        ),
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: (isEligible ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isEligible ? Icons.check_circle_rounded : Icons.schedule_rounded,
                color: isEligible ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                size: 28,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isEligible ? 'ELIGIBLE NOW' : 'COOLDOWN PERIOD',
                    style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w900,
                      color: isEligible ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isEligible ? '90-day gap completed — ready to donate' : 'Next eligible: $nextEligible',
                    style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5)),
                  ),
                ],
              ),
            ),
            if (isEligible)
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                child: const Text('Book', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTierCard(ThemeData theme) {
    final tiers = [
      {'name': 'Regular', 'min': 0, 'color': const Color(0xFF64748B)},
      {'name': 'Golden', 'min': 1500, 'color': const Color(0xFFF59E0B)},
      {'name': 'Elite', 'min': 3000, 'color': const Color(0xFF8B5CF6)},
      {'name': 'Diamond', 'min': 5000, 'color': const Color(0xFF06B6D4)},
    ];
    final progress = (raktTokens / 3000).clamp(0.0, 1.0);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Loyalty Tier Progress', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('$raktTokens / 3,000 tokens to Elite', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.white.withValues(alpha: 0.06),
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF59E0B)),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: tiers.map((t) => Text(
                t['name'] as String,
                style: TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w600,
                  color: (t['name'] == tier) ? (t['color'] as Color) : Colors.white.withValues(alpha: 0.3),
                ),
              )).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImpactStory(ThemeData theme) {
    return Card(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(colors: [const Color(0xFFD90429).withValues(alpha: 0.08), const Color(0xFFD90429).withValues(alpha: 0.02)]),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('💝', style: TextStyle(fontSize: 24)),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text('Your Impact Story', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                ),
                Text('New', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFFD90429))),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '"Your O- donation on Jan 15th was used in an emergency C-section at Apollo HSR. Both mother and baby are healthy. Thank you for being a hero."',
              style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: Colors.white.withValues(alpha: 0.7), height: 1.5),
            ),
            const SizedBox(height: 8),
            Text('— Dr. Sharma, Apollo Hospital HSR Layout', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.4), fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Quick Actions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _actionButton(Icons.local_hospital_rounded, 'Find Camp', const Color(0xFFEF4444)),
                _actionButton(Icons.receipt_long_rounded, '80G Receipt', const Color(0xFF3B82F6)),
                _actionButton(Icons.card_giftcard_rounded, 'Rewards', const Color(0xFFF59E0B)),
                _actionButton(Icons.share_rounded, 'Refer', const Color(0xFF10B981)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionButton(IconData icon, String label, Color color) {
    return GestureDetector(
      onTap: () {},
      child: Column(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.6))),
        ],
      ),
    );
  }

  void _showEmergencyAlert() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: [Color(0xFF780000), Color(0xFF450A0A)],
          ),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 24),
            const Icon(Icons.emergency_rounded, color: Color(0xFFEF4444), size: 64),
            const SizedBox(height: 16),
            const Text('EMERGENCY ALERT', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(color: const Color(0xFFEF4444).withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
              child: const Text('O- BLOOD NEEDED', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFFEF4444))),
            ),
            const SizedBox(height: 16),
            Text(
              'Apollo Hospital HSR Layout needs O- blood urgently. You are 4.2 km away. As a registered O- donor, your donation could save a life.',
              style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.8), height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.location_on, size: 14, color: Colors.white.withValues(alpha: 0.5)),
                const SizedBox(width: 4),
                Text('4.2 km • ETA 18 min', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white24),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Not Now', style: TextStyle(color: Colors.white54)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.navigation_rounded),
                    label: const Text('NAVIGATE', style: TextStyle(fontWeight: FontWeight.w800)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF780000),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
