/**
 * Pre-deployment Configuration Validation Script
 * Verifies environment variables, secrets presence, and operational readiness before deployment.
 */

const fs = require('node:fs');
const path = require('node:path');

function validateConfig() {
  const errors = [];
  const warnings = [];

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  console.log(`[CONFIG VALIDATION] Validating environment configuration (NODE_ENV=${nodeEnv})...`);

  // 1. JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      errors.push('CRITICAL: JWT_SECRET environment variable is missing in production.');
    } else {
      warnings.push('NOTICE: JWT_SECRET is not set; ephemeral runtime secret will be generated for development/testing.');
    }
  } else if (jwtSecret.length < 32) {
    errors.push(`CRITICAL: JWT_SECRET is too short (${jwtSecret.length} chars). Must be at least 32 characters for 256-bit entropy.`);
  }

  // 2. ADMIN_SERVICE_KEY
  const adminKey = process.env.ADMIN_SERVICE_KEY;
  if (!adminKey) {
    if (isProduction) {
      errors.push('CRITICAL: ADMIN_SERVICE_KEY environment variable is missing in production.');
    } else {
      warnings.push('NOTICE: ADMIN_SERVICE_KEY is not set; ephemeral runtime key will be generated for development/testing.');
    }
  } else if (adminKey.length < 32) {
    errors.push(`CRITICAL: ADMIN_SERVICE_KEY is too short (${adminKey.length} chars). Must be at least 32 characters.`);
  }

  // 3. Fabric Configuration
  const requireFabric = process.env.REQUIRE_FABRIC === 'true';
  const peerEndpoint = process.env.FABRIC_PEER_ENDPOINT;
  const tlsCertPath = process.env.FABRIC_TLS_CERT_PATH;
  const walletPath = process.env.FABRIC_WALLET_PATH;

  if (requireFabric) {
    if (!peerEndpoint) {
      errors.push('CRITICAL: REQUIRE_FABRIC is enabled but FABRIC_PEER_ENDPOINT is not set.');
    }
    if (tlsCertPath && !fs.existsSync(tlsCertPath)) {
      errors.push(`CRITICAL: REQUIRE_FABRIC is enabled but TLS cert path does not exist: ${tlsCertPath}`);
    }
    if (walletPath && !fs.existsSync(walletPath)) {
      errors.push(`CRITICAL: REQUIRE_FABRIC is enabled but wallet identity file does not exist: ${walletPath}`);
    }
  } else {
    warnings.push('NOTICE: REQUIRE_FABRIC is false. Gateway will use resilient durable outbox queue if peer is unreachable.');
  }

  // 4. Data directories check
  const dataDir = path.resolve(__dirname, '..', 'data');
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err) {
    errors.push(`CRITICAL: Cannot write to data directory ${dataDir}: ${err.message}`);
  }

  // Output report
  console.log('\n--- Configuration Preflight Report ---');
  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(`[WARN] ${w}`));
  }
  if (errors.length > 0) {
    errors.forEach(e => console.error(`[FAIL] ${e}`));
    console.error(`\nValidation FAILED with ${errors.length} critical configuration error(s).`);
    process.exit(1);
  }

  console.log('\n[PASS] All configuration checks passed successfully. Gateway is ready for deployment.');
  process.exit(0);
}

if (require.main === module) {
  validateConfig();
}

module.exports = { validateConfig };
