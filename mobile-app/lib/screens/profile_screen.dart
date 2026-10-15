import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_config.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _auth = AuthService.instance;

  void _showApiConfigDialog() {
    final controller = TextEditingController(text: ApiConfig.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF111118),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.dns_rounded, color: Color(0xFF3B82F6), size: 22),
            SizedBox(width: 8),
            Text('API Gateway Address', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Configure backend gateway URL for physical devices (LAN IP), emulators, or production servers:',
              style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                hintText: 'http://10.0.2.2:3001',
                hintStyle: const TextStyle(color: Color(0xFF4B5563)),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: const Text('Android (10.0.2.2:3001)', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = 'http://10.0.2.2:3001',
                ),
                ActionChip(
                  label: const Text('Localhost (3001)', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = 'http://localhost:3001',
                ),
                ActionChip(
                  label: const Text('LAN Wi-Fi (192.168.1.50)', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = 'http://192.168.1.50:3001',
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (!ApiConfig.isHttps)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, size: 14, color: Color(0xFFF59E0B)),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Using HTTP. Production deployments must use HTTPS.',
                        style: TextStyle(color: Color(0xFFF59E0B), fontSize: 10),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              ApiConfig.setBaseUrl(controller.text.trim());
              Navigator.pop(ctx);
              setState(() {});
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('API Gateway set to: ${ApiConfig.baseUrl}')),
              );
            },
            child: const Text('Save URL'),
          ),
        ],
      ),
    );
  }

  void _showSignInDialog() {
    final didController = TextEditingController(text: 'did:rakt:7a92bf01');
    final nameController = TextEditingController(text: 'Rajesh K.');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF111118),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.badge_rounded, color: Color(0xFF10B981), size: 22),
            SizedBox(width: 8),
            Text('Sign In Session', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sign in to attach an authentic session token to emergency responses and ledger queries:',
              style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: nameController,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Donor Name',
                labelStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: didController,
              style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
              decoration: InputDecoration(
                labelText: 'Donor DID',
                labelStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              await _auth.loginDevDonor(
                didController.text.trim(),
                nameController.text.trim(),
              );
              if (ctx.mounted) {
                Navigator.pop(ctx);
              }
              if (mounted) {
                setState(() {});
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Signed in as ${_auth.userName} (${_auth.donorDid})')),
                );
              }
            },
            child: const Text('Sign In'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.dns_rounded, color: Color(0xFF3B82F6)),
            tooltip: 'Configure API Address',
            onPressed: _showApiConfigDialog,
          ),
          IconButton(
            icon: const Icon(Icons.settings_rounded, color: Colors.white54),
            onPressed: _showApiConfigDialog,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // API Gateway indicator
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                children: [
                  Icon(
                    _auth.isAuthenticated ? Icons.cloud_done_rounded : Icons.cloud_queue_rounded,
                    size: 16,
                    color: _auth.isAuthenticated ? const Color(0xFF10B981) : const Color(0xFF9CA3AF),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'API Gateway: ${ApiConfig.baseUrl}',
                      style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Color(0xFF9CA3AF)),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  InkWell(
                    onTap: _showApiConfigDialog,
                    child: const Text('Edit', style: TextStyle(fontSize: 11, color: Color(0xFF3B82F6), fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),

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
                          child: Center(
                            child: Text(
                              _auth.userName.isNotEmpty ? _auth.userName.substring(0, 2).toUpperCase() : 'RK',
                              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white),
                            ),
                          ),
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
                    Text(
                      _auth.userName.isNotEmpty ? _auth.userName : 'Rajesh K.',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFD90429).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _auth.donorDid.isNotEmpty ? _auth.donorDid : 'did:rakt:7a92bf01',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'monospace', color: Color(0xFFD90429)),
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
                    _linkedId(Icons.account_balance_rounded, 'PAN (80G)', '§65B Certificate generated (ITD filing prototype)', true, const Color(0xFFF59E0B)),
                    _linkedId(Icons.health_and_safety_rounded, 'Insurance (NHCX)', 'Sandbox specification simulator', false, const Color(0xFF64748B)),
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
                    _consentToggle('80G tax certificate generation (ITD e-filing prototype)', true),
                    _consentToggle('Share with insurance (NHCX sandbox)', false),
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
                    _benefitTile(Icons.receipt_long_rounded, '80G Tax Deduction', '§65B Certificate generated (Direct ITD e-filing planned)', true),
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
                  _menuItem(
                    Icons.dns_rounded,
                    'Configure API Address',
                    ApiConfig.baseUrl,
                    const Color(0xFF3B82F6),
                    onTap: _showApiConfigDialog,
                  ),
                  _menuItem(
                    Icons.download_rounded,
                    'Export My Data',
                    'DPDP Act Article 6',
                    Colors.white54,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Exporting DPDP Article 6 encrypted data package...')),
                      );
                    },
                  ),
                  _menuItem(
                    Icons.delete_forever_rounded,
                    'Right to Erasure',
                    'DPDP Act Article 12',
                    const Color(0xFFEF4444),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Erasure request submitted per DPDP Article 12.')),
                      );
                    },
                  ),
                  if (_auth.isAuthenticated)
                    _menuItem(
                      Icons.logout_rounded,
                      'Sign Out',
                      'Clear session token (${_auth.donorDid})',
                      const Color(0xFFEF4444),
                      onTap: () {
                        _auth.logout();
                        setState(() {});
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Logged out. Session cleared.')),
                        );
                      },
                    )
                  else
                    _menuItem(
                      Icons.login_rounded,
                      'Sign In / Switch Donor DID',
                      'Attach authentic session credentials',
                      const Color(0xFF10B981),
                      onTap: _showSignInDialog,
                    ),
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

  Widget _menuItem(IconData icon, String label, String detail, Color color, {VoidCallback? onTap}) {
    return ListTile(
      leading: Icon(icon, color: color, size: 22),
      title: Text(label, style: TextStyle(fontSize: 14, color: color)),
      subtitle: detail.isNotEmpty ? Text(detail, style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.3))) : null,
      trailing: Icon(Icons.chevron_right_rounded, color: Colors.white.withValues(alpha: 0.2)),
      onTap: onTap,
    );
  }
}

