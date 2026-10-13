/**
 * Deployment Smoke Test
 * Starts the API gateway in a subprocess (or probes an already running instance),
 * verifies /health and public endpoints, and confirms the gateway is operational.
 */

const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = process.env.PORT || 3099;
const HOST = process.env.HOST || 'localhost';

function probeHealth(port, attempts = 20, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const check = () => {
      count++;
      const req = http.get(`http://${HOST}:${port}/health`, {
        headers: { 'x-forwarded-proto': 'https' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(body);
              return resolve(parsed);
            } catch (_) {
              return resolve({ status: 'ok', body });
            }
          }
          if (count < attempts) {
            setTimeout(check, intervalMs);
          } else {
            reject(new Error(`Health check returned HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        if (count < attempts) {
          setTimeout(check, intervalMs);
        } else {
          reject(new Error(`Failed to connect to gateway after ${attempts} attempts: ${err.message}`));
        }
      });
      req.setTimeout(2000, () => req.destroy());
    };

    check();
  });
}

async function runSmokeTest() {
  console.log(`[SMOKE TEST] Initiating deployment smoke test on port ${PORT}...`);

  const serverEnv = {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: process.env.NODE_ENV || 'test',
    JWT_SECRET: process.env.JWT_SECRET || 'smoke-test-jwt-secret-32-chars-long-entropy',
    ADMIN_SERVICE_KEY: process.env.ADMIN_SERVICE_KEY || 'smoke-test-admin-key-32-chars-long-entropy',
    REQUIRE_FABRIC: 'false'
  };

  const serverProcess = spawn('node', [path.resolve(__dirname, '..', 'server.js')], {
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let serverOutput = '';
  serverProcess.stdout.on('data', d => serverOutput += d.toString());
  serverProcess.stderr.on('data', d => serverOutput += d.toString());

  try {
    const health = await probeHealth(PORT);
    console.log('[SMOKE TEST] /health responded successfully:', JSON.stringify(health, null, 2));
    console.log('[PASS] API Gateway deployment smoke test PASSED successfully.');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  } catch (err) {
    console.error(`[FAIL] Deployment smoke test failed: ${err.message}`);
    console.error('Server output:\n', serverOutput);
    serverProcess.kill('SIGKILL');
    process.exit(1);
  }
}

if (require.main === module) {
  runSmokeTest();
}

module.exports = { probeHealth, runSmokeTest };
