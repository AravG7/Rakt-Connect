import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded, color: Colors.white54),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile Header
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Avatar
                    Stack(
                      children: [
                        Container(
                          width: 80, height: 80,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFFD90429), Color(0xFF780000)]),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Center(child: Text('RK', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white))),
                        ),
                        Positioned(
                          bottom: -2, right: -2,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF0A0E1A), width: 2),
                            ),
                            child: const Icon(Icons.verified_rounded, size: 14, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Text('Rajesh K.', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFD90429).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'did:rakt:7a92bf01',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'monospace', color: Color(0xFFD90429)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Stats Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _profileStat('O-', 'Blood Group', const Color(0xFFEF4444)),
                        _divider(),
                        _profileStat('8', 'Donations', const Color(0xFF10B981)),
                        _divider(),
                        _profileStat('Golden', 'Tier', const Color(0xFFF59E0B)),
                        _divider(),
                        _profileStat('2,400', 'Tokens', const Color(0xFF3B82F6)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Linked IDs
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Linked Identities', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 14),
                    _linkedId(Icons.badge_rounded, 'ABHA ID', '91-XXXX-XXXX-4821', true, const Color(0xFF10B981)),
                    _linkedId(Icons.fingerprint_rounded, 'Aadhaar (Hashed)', 'SHA-256 stored on-chain', true, const Color(0xFF3B82F6)),
                    _linkedId(Icons.account_balance_rounded, 'PAN (80G)', 'Linked for tax receipts', true, const Color(0xFFF59E0B)),
                    _linkedId(Icons.health_and_safety_rounded, 'Insurance (NHCX)', 'Not linked', false, const Color(0xFF64748B)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Privacy & Consent (DPDP Act)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text('Privacy & Consent', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text('DPDP Act 2023', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF10B981))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _consentToggle('Share donation data with hospitals', true),
                    _consentToggle('Emergency broadcast notifications', true),
                    _consentToggle('80G auto-submission to IT Dept', true),
                    _consentToggle('Share with insurance (NHCX)', false),
                    _consentToggle('Allow anonymized research use', true),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.03),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.shield_rounded, size: 18, color: Color(0xFF10B981)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Zero PII stored on blockchain. Only hashed references. Full DPDP Act 2023 compliance.',
                              style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.4), height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Benefits
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Your Benefits', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 14),
                    _benefitTile(Icons.local_hospital_rounded, 'OPD Priority Access', 'Skip queue at 200+ hospitals', true),
                    _benefitTile(Icons.health_and_safety_rounded, 'Health Checkup', 'Free annual screening', true),
                    _benefitTile(Icons.receipt_long_rounded, '80G Tax Deduction', 'Auto-filed with IT Dept', true),
                    _benefitTile(Icons.shield_outlined, 'Insurance Discount', '5% premium reduction', false),
                    _benefitTile(Icons.diamond_rounded, 'Diamond Lounge', 'Reach 5,000 tokens to unlock', false),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Actions
            Card(
              child: Column(
                children: [
                  _menuItem(Icons.download_rounded, 'Export My Data', 'DPDP Act Article 6', Colors.white54),
                  _menuItem(Icons.delete_forever_rounded, 'Right to Erasure', 'DPDP Act Article 12', const Color(0xFFEF4444)),
                  _menuItem(Icons.logout_rounded, 'Sign Out', '', Colors.white54),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _profileStat(String value, String label, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.4))),
      ],
    );
  }

  Widget _divider() {
    return Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.06));
  }

  Widget _linkedId(IconData icon, String service, String detail, bool linked, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(service, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                Text(detail, style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.4))),
              ],
            ),
          ),
          Icon(
            linked ? Icons.check_circle_rounded : Icons.add_circle_outline_rounded,
            size: 20,
            color: linked ? const Color(0xFF10B981) : const Color(0xFF64748B),
          ),
        ],
      ),
    );
  }

  Widget _consentToggle(String label, bool value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.7)))),
          Switch(
            value: value,
            onChanged: (_) {},
            activeThumbColor: const Color(0xFF10B981),
            inactiveTrackColor: Colors.white.withValues(alpha: 0.06),
          ),
        ],
      ),
    );
  }

  Widget _benefitTile(IconData icon, String title, String subtitle, bool unlocked) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: unlocked
                  ? const Color(0xFFF59E0B).withValues(alpha: 0.12)
                  : Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: unlocked ? const Color(0xFFF59E0B) : const Color(0xFF64748B)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: unlocked ? Colors.white : const Color(0xFF64748B))),
                Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: unlocked ? 0.4 : 0.2))),
              ],
            ),
          ),
          if (unlocked) const Icon(Icons.check_circle_rounded, size: 18, color: Color(0xFF10B981))
          else Icon(Icons.lock_rounded, size: 16, color: Colors.white.withValues(alpha: 0.2)),
        ],
      ),
    );
  }

  Widget _menuItem(IconData icon, String label, String detail, Color color) {
    return ListTile(
      leading: Icon(icon, color: color, size: 22),
      title: Text(label, style: TextStyle(fontSize: 14, color: color)),
      subtitle: detail.isNotEmpty ? Text(detail, style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.3))) : null,
      trailing: Icon(Icons.chevron_right_rounded, color: Colors.white.withValues(alpha: 0.2)),
      onTap: () {},
    );
  }
}
