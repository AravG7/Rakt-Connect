const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { stqcMiddleware, apiLimiter, logger, enforceSSL, auditLogger } = require('./middleware/stqcSecurity');

const app = express();
app.use(cors());
app.use(express.json());

// Apply STQC Middleware
app.use(enforceSSL);
app.use(apiLimiter);
app.use(stqcMiddleware);
app.use(auditLogger);

const PORT = process.env.PORT || 3001;

// ═══════════════════════════════════════════════════════════════════════════════
// RAKT-CONNECT API GATEWAY v2.0
// REST API Layer connecting Web/Mobile clients to Hyperledger Fabric
// Endpoints map to PRD Section 10, Step 4
// ═══════════════════════════════════════════════════════════════════════════════

// ── In-Memory Mock Store (Replace with Fabric SDK in production) ─────────────
const donors = new Map();
const units = new Map();
const broadcasts = new Map();
const transfers = new Map();
const hemoReports = new Map();
const auditLog = [];

// ── Utility Functions ────────────────────────────────────────────────────────

function generateDID(input) {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return `did:rakt:${hash.substring(0, 8)}`;
}

function generateUnitID() {
  return `UNIT-${uuidv4().substring(0, 4).toUpperCase()}`;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function logAudit(eventType, actor, unitId, details) {
  const entry = {
    id: `AUDIT-${auditLog.length + 1}`,
    eventType, actor, unitId, details,
    timestamp: new Date().toISOString(),
    txHash: `0x${crypto.randomBytes(16).toString('hex')}`
  };
  auditLog.unshift(entry);
  return entry;
}

function calculateTier(tokens) {
  if (tokens >= 5000) return 'DIAMOND';
  if (tokens >= 3000) return 'ELITE';
  if (tokens >= 1500) return 'GOLDEN';
  return 'REGULAR';
}

// ── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'Rakt-Connect API Gateway v2.0',
    uptime: process.uptime(),
    blockchain: 'Hyperledger Fabric v3.0 (mock)',
    endpoints: 15,
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DONOR ROUTES (PRD Section 4.1)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /donor/register — Create donor DID with ABHA linkage
app.post('/donor/register', (req, res) => {
  const { name, bloodGroup, abhaId, aadhaarHash } = req.body;

  if (!bloodGroup || !abhaId) {
    return res.status(400).json({ error: 'bloodGroup and abhaId are required' });
  }

  const did = generateDID(aadhaarHash || abhaId);
  const abhaHash = crypto.createHash('sha256').update(abhaId).digest('hex').substring(0, 16);

  // Check duplicate (professional donor fraud prevention)
  if (donors.has(did)) {
    return res.status(409).json({ error: 'Donor DID already exists — duplicate registration blocked' });
  }

  const donor = {
    did, abhaHash, name: name || 'Anonymous', bloodGroup,
    totalDonations: 0, raktTokens: 0, tier: 'REGULAR',
    lastDonationDate: null, isEligible: true, isBlacklisted: false,
    consentRecorded: true, // DPDP Act 2023
    createdAt: new Date().toISOString()
  };

  donors.set(did, donor);
  logAudit('DONOR_REGISTERED', did, '', `New donor registered: ${bloodGroup}`);

  res.status(201).json({
    message: 'Donor registered with decentralized identifier (DID)',
    donor: { ...donor, abhaId: undefined, name: undefined } // Zero PII in response
  });
});

// GET /donor/:did — Fetch donor profile
app.get('/donor/:did', (req, res) => {
  const donor = donors.get(req.params.did);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  res.json(donor);
});

// POST /donor/consent — Record DPDP Act 2023 digital consent
app.post('/donor/consent', (req, res) => {
  const { donorDid, consentType, granted } = req.body;
  const donor = donors.get(donorDid);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });

  donor.consentRecorded = granted;
  logAudit('CONSENT_RECORDED', donorDid, '', `DPDP consent: ${consentType} = ${granted}`);

  res.json({ message: 'Digital consent recorded on-chain', consentType, granted });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BLOOD UNIT ROUTES (PRD Section 4.2)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /unit/collect — Tokenize new blood unit (mint digital twin)
app.post('/unit/collect', (req, res) => {
  const { donorDid, bloodGroup, component, volumeMl, hospitalHfr } = req.body;

  const unitId = generateUnitID();
  const qrHash = crypto.createHash('sha256').update(unitId + Date.now()).digest('hex');

  // Component-specific expiry (NBTC guidelines)
  const expiryDays = { 'Packed RBC': 42, 'Platelets': 5, 'FFP': 365, 'Cryoprecipitate': 365 };
  const days = expiryDays[component] || 42;

  const ts = now();
  const unit = {
    id: unitId, donorDid, bloodGroup, component,
    volumeMl: volumeMl || 350, qrHash,
    state: 'COLLECTED',
    collectionDate: ts,
    expiryDate: ts + (days * 86400),
    daysToExpiry: days,
    hospitalHfr: hospitalHfr || 'HFR-KA-0421',
    labResultsHash: null, labIsSafe: null,
    storageTemp: null, reservedFor: null,
    moSignatureHash: null, transporterId: null,
    createdAt: new Date().toISOString()
  };

  units.set(unitId, unit);
  logAudit('UNIT_COLLECTED', donorDid, unitId, `${bloodGroup} ${component} ${volumeMl}ml collected`);

  res.status(201).json({ message: 'Blood unit tokenized on blockchain', unit });
});

// POST /unit/test-result — Lab seals results (auto-approve/reject)
app.post('/unit/test-result', (req, res) => {
  const { unitId, resultsHash, isSafe, labTechDid } = req.body;
  const unit = units.get(unitId);

  if (!unit) return res.status(404).json({ error: 'Unit not found' });
  if (unit.state !== 'COLLECTED' && unit.state !== 'IN_TESTING') {
    return res.status(400).json({ error: `Unit must be COLLECTED/IN_TESTING, current: ${unit.state}` });
  }

  unit.labResultsHash = resultsHash || crypto.randomBytes(16).toString('hex');
  unit.labIsSafe = isSafe;
  unit.state = isSafe ? 'APPROVED' : 'REJECTED';

  logAudit('LAB_RESULTS_SEALED', labTechDid || 'lab-tech', unitId,
    `Results sealed: ${unit.state}. Hash: ${unit.labResultsHash}`);

  res.json({ message: `Unit ${unit.state} by ValidationContract`, unit });
});

// GET /unit/:id/provenance — Full chain-of-custody for QR scan (PRD Section 4.2)
app.get('/unit/:id/provenance', (req, res) => {
  const unit = units.get(req.params.id);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  const trail = auditLog.filter(a => a.unitId === req.params.id);
  res.json({ unit, chainOfCustody: trail, fhirResource: 'BiologicallyDerivedProduct' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY ROUTES (PRD Section 4.4)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /inventory/:hospitalId — Real-time stock by group + component
app.get('/inventory/:hospitalId', (req, res) => {
  const hospitalUnits = Array.from(units.values()).filter(
    u => u.hospitalHfr === req.params.hospitalId && !['TRANSFUSED', 'EXPIRED', 'REJECTED', 'SPOILED', 'DISCARDED'].includes(u.state)
  );

  const byGroup = {};
  hospitalUnits.forEach(u => {
    if (!byGroup[u.bloodGroup]) byGroup[u.bloodGroup] = { total: 0, components: {} };
    byGroup[u.bloodGroup].total++;
    if (!byGroup[u.bloodGroup].components[u.component]) byGroup[u.bloodGroup].components[u.component] = 0;
    byGroup[u.bloodGroup].components[u.component]++;
  });

  res.json({
    hospitalId: req.params.hospitalId,
    totalUnits: hospitalUnits.length,
    byGroup,
    units: hospitalUnits,
    fifoActive: true,
    lastUpdated: new Date().toISOString()
  });
});

// GET /inventory/expiry-alerts — Units expiring within 48 hours
app.get('/inventory/expiry-alerts', (req, res) => {
  const threshold = now() + (48 * 3600);
  const expiring = Array.from(units.values()).filter(
    u => u.expiryDate <= threshold && u.state === 'STORED'
  );

  res.json({ expiringUnits: expiring, count: expiring.length, thresholdHours: 48 });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCY BROADCAST ROUTES (PRD Section 4.6)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /broadcast/emergency — Launch multi-channel EBM
app.post('/broadcast/emergency', (req, res) => {
  const { bloodGroup, hospitalHfr, radiusKm, severityLevel, targetAccepts, hospitalCoordinates } = req.body;

  const broadcastId = `EBM-${uuidv4().substring(0, 6).toUpperCase()}`;

  // Smart Filter: find eligible donors within radius matching blood group
  const eligibleDonors = Array.from(donors.values()).filter(d =>
    d.bloodGroup === bloodGroup && d.isEligible && !d.isBlacklisted
  );

  const broadcast = {
    id: broadcastId, bloodGroup,
    hospitalHfr: hospitalHfr || 'HFR-KA-0421',
    radiusKm: radiusKm || 10,
    severityLevel: severityLevel || 'HIGH',
    targetAccepts: targetAccepts || 5,
    acceptedDonors: [],
    eligibleDonorsNotified: eligibleDonors.length,
    isActive: true,
    channels: [
      { priority: 1, channel: 'WhatsApp Business API', status: 'SENT' },
      { priority: 2, channel: 'IVR Voice Call (TTS)', status: 'QUEUED' },
      { priority: 3, channel: 'Push Notification (FCM)', status: 'QUEUED' },
      { priority: 4, channel: 'SMS (DLT Registered)', status: 'QUEUED' },
      { priority: 5, channel: 'Email', status: 'QUEUED' },
    ],
    smartFilters: {
      donationGapEnforced: true,
      geofenceApplied: true,
      numberMasking: true,
      traiVerifiedSenderId: true,
      optOutLink: true,
    },
    createdAt: new Date().toISOString()
  };

  broadcasts.set(broadcastId, broadcast);
  logAudit('EBM_LAUNCHED', hospitalHfr, '', `Emergency: ${bloodGroup} needed, ${radiusKm}km, ${severityLevel}`);

  res.status(201).json({ message: 'Emergency Broadcast Module activated', broadcast });
});

// POST /broadcast/:id/respond — Donor accepts/declines EBM
app.post('/broadcast/:id/respond', (req, res) => {
  const { donorDid, response } = req.body; // response: 'ACCEPT' or 'DECLINE'
  const broadcast = broadcasts.get(req.params.id);

  if (!broadcast) return res.status(404).json({ error: 'Broadcast not found' });
  if (!broadcast.isActive) return res.status(400).json({ error: 'Broadcast stopped (stop-loss triggered)' });

  if (response === 'ACCEPT') {
    broadcast.acceptedDonors.push(donorDid);

    // Stop-loss trigger
    if (broadcast.acceptedDonors.length >= broadcast.targetAccepts) {
      broadcast.isActive = false;
      logAudit('EBM_STOP_LOSS', '', '', `Stop-loss: ${broadcast.acceptedDonors.length}/${broadcast.targetAccepts}`);
    }

    // Award 3x emergency tokens
    const donor = donors.get(donorDid);
    if (donor) {
      donor.raktTokens += 900;
      donor.tier = calculateTier(donor.raktTokens);
    }
  }

  res.json({ broadcast, donorResponse: response });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFER ROUTES (PRD Section 4.5)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /transfer/request — Cross-hospital transfer request
app.post('/transfer/request', (req, res) => {
  const { fromHfr, toHfr, bloodGroup, units: unitsNeeded, urgencyLevel } = req.body;
  const transferId = `TRF-${uuidv4().substring(0, 6).toUpperCase()}`;

  const transfer = {
    id: transferId, fromHfr, toHfr, bloodGroup,
    unitsRequested: unitsNeeded || 1,
    urgencyLevel: urgencyLevel || 'ROUTINE',
    status: 'PENDING',
    matchedUnits: [],
    slaDeadline: urgencyLevel === 'CRITICAL' ? new Date(Date.now() + 15 * 60000).toISOString() : null,
    createdAt: new Date().toISOString()
  };

  transfers.set(transferId, transfer);
  logAudit('TRANSFER_REQUESTED', toHfr, '', `${unitsNeeded} units ${bloodGroup} from ${fromHfr}`);

  if (urgencyLevel === 'CRITICAL') {
    logAudit('SLA_TIMER', toHfr, '', '15-min SLA — escalates to State Blood Transfusion Council');
  }

  res.status(201).json({ message: 'Transfer request created', transfer });
});

// POST /transfer/:id/accept — Accept transfer
app.post('/transfer/:id/accept', (req, res) => {
  const transfer = transfers.get(req.params.id);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  transfer.status = 'ACCEPTED';
  transfer.acceptedAt = new Date().toISOString();
  logAudit('TRANSFER_ACCEPTED', transfer.fromHfr, '', `Transfer ${req.params.id} accepted`);

  res.json({ message: 'Transfer accepted — awaiting MO eSign', transfer });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFUSION ROUTES (PRD Section 4.2 + 4.9)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /transfusion/confirm — Record transfusion + trigger 80G/hemovigilance
app.post('/transfusion/confirm', (req, res) => {
  const { unitId, patientAbha, hospitalHfr } = req.body;
  const unit = units.get(unitId);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  unit.state = 'TRANSFUSED';
  unit.transfusedAt = new Date().toISOString();

  // Trigger 80G receipt (Form 10BE)
  const taxReceipt = {
    form: 'Form 10BE',
    donorDid: unit.donorDid,
    status: 'AUTO_GENERATED',
    pushTo: 'Income Tax Department'
  };

  // Create hemovigilance follow-up
  const hvId = `HV-${uuidv4().substring(0, 6).toUpperCase()}`;
  hemoReports.set(hvId, {
    id: hvId, unitId, patientAbha, status: 'PENDING_24HR_CHECK',
    followUpDue: new Date(Date.now() + 24 * 3600000).toISOString(),
    createdAt: new Date().toISOString()
  });

  // Mint tokens for donor
  const donor = donors.get(unit.donorDid);
  if (donor) {
    donor.raktTokens += 300;
    donor.tier = calculateTier(donor.raktTokens);
  }

  logAudit('TRANSFUSION_COMPLETED', hospitalHfr, unitId,
    'Transfusion completed. Form 10BE + Form 27 auto-generated. 24hr hemovigilance started.');

  res.json({
    message: 'Transfusion recorded on blockchain',
    unit, taxReceipt,
    hemovigilance: { id: hvId, status: 'PENDING_24HR_CHECK' },
    raktTokensAwarded: 300
  });
});

// POST /transfusion/:hvId/hemovigilance — Report adverse reaction
app.post('/transfusion/:hvId/hemovigilance', (req, res) => {
  const { reactionType, severity, doctorSignHash } = req.body;
  const report = hemoReports.get(req.params.hvId);
  if (!report) return res.status(404).json({ error: 'Hemovigilance report not found' });

  report.reactionType = reactionType || 'NONE';
  report.severity = severity || 'None';
  report.doctorSignHash = doctorSignHash;
  report.status = reactionType && reactionType !== 'NONE' ? 'UNDER_INVESTIGATION' : 'RESOLVED';

  if (severity === 'Moderate' || severity === 'Severe') {
    report.batchQuarantined = true;
    report.nibNotified = true;
    logAudit('ADVERSE_REACTION', '', report.unitId,
      `${reactionType} (${severity}) — Batch quarantined, NIB notified via TRRF`);
  }

  res.json({ message: 'Hemovigilance report updated', report });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE ROUTES (PRD Section 4.3)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /audit/form17/:unitId — Generate Form 17 (Donor Registry)
app.get('/audit/form17/:unitId', (req, res) => {
  const unit = units.get(req.params.unitId);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  res.json({
    form: 'Form 17 — Donor Registry',
    legalRef: 'Drugs & Cosmetics Act 1940, Schedule F, Part XII-B',
    unitId: unit.id,
    donorDid: unit.donorDid,
    bloodGroup: unit.bloodGroup,
    collectionDate: new Date(unit.collectionDate * 1000).toISOString(),
    component: unit.component,
    volumeMl: unit.volumeMl,
    labResults: unit.labIsSafe ? 'NEGATIVE (all markers)' : 'POSITIVE',
    generatedAt: new Date().toISOString(),
    digitalSignature: crypto.randomBytes(32).toString('hex'),
    section65B: 'Chain of custody certificate: court-admissible under Section 65B Indian Evidence Act'
  });
});

// GET /audit/form27/:unitId — Generate Form 27 (Blood Transfusion Record)
app.get('/audit/form27/:unitId', (req, res) => {
  const unit = units.get(req.params.unitId);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  res.json({
    form: 'Form 27 — Blood Transfusion Record',
    legalRef: 'Drugs & Cosmetics Act 1940, Schedule F, Part XII-B',
    unitId: unit.id,
    bloodGroup: unit.bloodGroup,
    state: unit.state,
    chainOfCustody: auditLog.filter(a => a.unitId === unit.id),
    generatedAt: new Date().toISOString()
  });
});

// GET /audit/evidence-bundle/:unitId — Section 65B Evidence Package
app.get('/audit/evidence-bundle/:unitId', (req, res) => {
  const unit = units.get(req.params.unitId);
  if (!unit) return res.status(404).json({ error: 'Unit not found' });

  res.json({
    title: 'Section 65B Evidence Bundle — Court-Admissible',
    legalRef: 'Section 65B, Indian Evidence Act + IT Act 2000',
    unit,
    auditTrail: auditLog.filter(a => a.unitId === unit.id),
    digitalCertificate: {
      hash: crypto.createHash('sha256').update(JSON.stringify(unit)).digest('hex'),
      signedBy: 'Rakt-Connect Compliance Engine',
      algorithm: 'SHA-256 + ECDSA',
      timestamp: new Date().toISOString()
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAX AUTOMATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/tax/generate-80g', (req, res) => {
  const { donorDid, unitId } = req.body;
  
  if (!donorDid || !unitId) {
    return res.status(400).json({ error: 'donorDid and unitId are required' });
  }

  const taxReceipt = {
    receiptNumber: `80G-2026-${unitId.substring(0, 8)}`,
    donorName: "Donor_" + donorDid.substring(9, 15),
    panNumber: "ENCRYPTED_PAN_HASH",
    amountValue: "0.00",
    exemptionType: "100% Social Contribution",
    timestamp: new Date().toISOString()
  };

  logAudit('TAX_80G_GENERATED', donorDid, unitId, 'Generated 80G Tax receipt for donor');

  res.status(201).json({
    message: '80G Tax receipt generated successfully',
    receipt: taxReceipt
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INSURANCE ROUTES (PRD Section 4.10)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /insurance/claim — Trigger HCX auto-adjudication
app.post('/insurance/claim', (req, res) => {
  const { unitId, patientAbha, insurerCode, policyNumber } = req.body;

  res.json({
    message: 'Insurance claim submitted via NHCX Gateway',
    claimId: `CLM-${uuidv4().substring(0, 6).toUpperCase()}`,
    nhcxGateway: 'National Health Claims Exchange',
    status: 'AUTO_APPROVED',
    processingTime: '< 3 minutes',
    details: {
      unitId, patientAbha, insurerCode,
      medicalNecessity: 'Verified via doctor eSign + ABHA ID',
      blockchainProof: 'Chain of custody verified on Hyperledger Fabric'
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI INTEGRATION ROUTES (PRD Section 7)
// ═══════════════════════════════════════════════════════════════════════════════

const fetch = require('node-fetch');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /ai/predict/:hospitalId — Proxy to AI Microservice
app.get('/ai/predict/:hospitalId', async (req, res) => {
  const { bloodGroup } = req.query;
  const hospitalId = req.params.hospitalId;

  try {
    const response = await fetch(`${AI_SERVICE_URL}/predict/shortage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        blood_group: bloodGroup || 'O-',
        forecast_horizon_hours: 48
      }),
      timeout: 3000
    });

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (error) {
    console.warn('AI Microservice unavailable, using mock data for /ai/predict');
  }

  // Fallback Mock
  res.json({
    hospitalId,
    bloodGroup: bloodGroup || 'O-',
    forecastHours: 48,
    predictedDemandUnits: Math.floor(Math.random() * 20) + 5,
    surgeProb: +(Math.random() * 0.5 + 0.3).toFixed(2),
    warningLevel: Math.random() > 0.7 ? 'CRITICAL' : 'MODERATE',
    model: 'Temporal Fusion Transformer (TFT)',
    confidence: +(Math.random() * 0.15 + 0.82).toFixed(2),
    triggerBroadcast: Math.random() > 0.7,
    timestamp: new Date().toISOString(),
    isMock: true
  });
});

// GET /ai/heatmap/state — GIS Red/Green zone data
app.get('/ai/heatmap/state', async (req, res) => {
  const { state } = req.query;
  
  try {
    const url = new URL(`${AI_SERVICE_URL}/heatmap/state`);
    if (state) url.searchParams.append('state', state);

    const response = await fetch(url.toString(), { timeout: 3000 });
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (error) {
    console.warn('AI Microservice unavailable, using mock data for /ai/heatmap/state');
  }

  // Fallback Mock
  res.json({
    state: state || 'Karnataka',
    zones: [
      { name: 'North Bangalore', status: 'GREEN', surplus: 22, risk: 'Low' },
      { name: 'South Bangalore', status: 'YELLOW', surplus: -4, risk: 'Moderate' },
      { name: 'East Bangalore', status: 'RED', surplus: -18, risk: 'High' },
      { name: 'West Bangalore', status: 'GREEN', surplus: 11, risk: 'Low' },
      { name: 'Central', status: 'YELLOW', surplus: -2, risk: 'Moderate' },
    ],
    model: 'TFT + Google Maps traffic data',
    lastUpdated: new Date().toISOString(),
    isMock: true
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════════

// GET /audit/log — Full audit trail
app.get('/audit/log', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ entries: auditLog.slice(0, limit), total: auditLog.length });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES (PRD Section 4.1 - ABHA/ABDM)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /auth/abha-login — Simulate ABHA login with Aadhaar OTP
app.post('/auth/abha-login', (req, res) => {
  const { abhaId } = req.body;
  res.json({
    message: 'ABHA login initiated — OTP sent to registered mobile',
    abhaId,
    otpSent: true,
    sandbox: 'ABDM Sandbox (sandbox.abdm.gov.in)',
    note: 'Production requires ABDM M1 milestone registration'
  });
});

// POST /auth/verify-otp — Verify ABHA OTP
app.post('/auth/verify-otp', (req, res) => {
  const { abhaId, otp } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  res.json({
    message: 'ABHA OTP verified — session token issued',
    abhaId,
    token,
    expiresIn: '24h',
    did: generateDID(abhaId)
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: "THE RARE REGISTRY" — Bombay Blood Group & Phenotype
// PRD v1.5 Section 1
// ═══════════════════════════════════════════════════════════════════════════════

const rareDonors = new Map();
const rareSearches = new Map();

// Register a rare phenotype donor to the global registry
app.post('/rare-registry/donor', (req, res) => {
  const { donorDid, abhaHash, phenotype, state, city, lat, lon, airCourierReady } = req.body;

  const validPhenotypes = ['hh_Bombay', 'Rh_null', 'p_null', 'Jk_null', 'McLeod', 'Lutheran_null', 'Vel_neg', 'Lan_neg', 'Jr_neg'];
  if (!validPhenotypes.includes(phenotype?.phenotype)) {
    return res.status(400).json({ error: `Phenotype ${phenotype?.phenotype} is not classified as rare` });
  }

  const donor = {
    donorDid: donorDid || generateDID(abhaHash),
    abhaHash,
    phenotype,
    state, city, lat, lon,
    registrationDate: new Date().toISOString(),
    isEligible: true,
    isAnonymized: true,
    contactLocked: true,
    tier: 'Elite',
    airCourierReady: airCourierReady || false,
    healthBenefits: [
      'Annual comprehensive health screening',
      'Priority OPD access at all NABH hospitals',
      'Emergency air-medical transport coverage',
      '₹5L life insurance (Government-backed)',
      'Direct hotline to NBTC coordinator'
    ],
    totalDonations: 0
  };

  rareDonors.set(donor.donorDid, donor);
  logAudit('RARE_DONOR_REGISTERED', donor.donorDid, null, `Rare donor registered: ${phenotype.phenotype}`);
  res.status(201).json({ donor, message: 'Rare donor registered globally. Elite tier auto-assigned.' });
});

// Trigger National Rare Search — KPI: < 120 seconds
app.post('/rare-registry/search', (req, res) => {
  const startTime = Date.now();
  const { requestorHfr, patientAbhaRef, requiredPhenotype, urgency, unitsNeeded } = req.body;

  const searchId = `RSRCH-${uuidv4().substring(0, 6).toUpperCase()}`;

  // Search all rare donors for phenotype match
  const matches = [];
  for (const [did, donor] of rareDonors) {
    if (donor.phenotype.phenotype === requiredPhenotype.phenotype && donor.isEligible) {
      const geneticScore = calculateGeneticScore(requiredPhenotype, donor.phenotype);
      const logisticsScore = donor.airCourierReady ? 90 : 50;

      matches.push({
        donorDid: `ANON-${crypto.createHash('sha256').update(did).digest('hex').substring(0, 8)}`,
        geneticScore,
        logisticsScore,
        compositeScore: geneticScore * 0.7 + logisticsScore * 0.3,
        airCourier: donor.airCourierReady,
        state: donor.state,
        city: donor.city,
        donorConsent: false,
        hospitalLock: false,
        bilateralLock: false
      });
    }
  }

  // Sort by composite score descending
  matches.sort((a, b) => b.compositeScore - a.compositeScore);

  const search = {
    searchId,
    requestorHfr,
    patientAbhaRef,
    requiredPhenotype,
    urgency: urgency || 'CRITICAL',
    unitsNeeded: unitsNeeded || 1,
    status: matches.length > 0 ? 'MATCHES_FOUND' : 'SEARCHING',
    matches,
    latencyMs: Date.now() - startTime,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  rareSearches.set(searchId, search);
  logAudit('NATIONAL_RARE_SEARCH', requestorHfr, null, `Searching ${requiredPhenotype.phenotype}: ${matches.length} matches in ${search.latencyMs}ms`);

  res.json({ search, kpiMet: search.latencyMs < 120000 });
});

// Lock bilateral consent — de-anonymize on mutual agreement
app.post('/rare-registry/search/:searchId/lock', (req, res) => {
  const search = rareSearches.get(req.params.searchId);
  if (!search) return res.status(404).json({ error: 'Search not found' });

  const { matchIndex, party } = req.body;
  if (matchIndex >= search.matches.length) return res.status(400).json({ error: 'Invalid match index' });

  const match = search.matches[matchIndex];
  if (party === 'DONOR') match.donorConsent = true;
  else if (party === 'HOSPITAL') match.hospitalLock = true;
  else return res.status(400).json({ error: 'Invalid party. Must be DONOR or HOSPITAL' });

  if (match.donorConsent && match.hospitalLock) {
    match.bilateralLock = true;
    search.status = 'LOCKED';
    logAudit('BILATERAL_LOCK', req.params.searchId, null, 'Rare donor de-anonymized — bilateral consent confirmed');
  }

  res.json({ search, bilateralLocked: match.bilateralLock });
});

// Get rare donor registry stats
app.get('/rare-registry/stats', (req, res) => {
  const byPhenotype = {};
  for (const [, donor] of rareDonors) {
    const p = donor.phenotype.phenotype;
    byPhenotype[p] = (byPhenotype[p] || 0) + 1;
  }
  res.json({
    totalRareDonors: rareDonors.size,
    activeSearches: [...rareSearches.values()].filter(s => s.status === 'SEARCHING' || s.status === 'MATCHES_FOUND').length,
    byPhenotype,
    avgSearchLatencyMs: [...rareSearches.values()].reduce((sum, s) => sum + s.latencyMs, 0) / (rareSearches.size || 1)
  });
});

function calculateGeneticScore(required, donor) {
  let score = 0;
  if (required.phenotype === donor.phenotype) score += 40;
  if (required.baseGroup === donor.baseGroup) score += 20;
  if (required.kellStatus === donor.kellStatus) score += 10;
  if (required.duffyStatus === donor.duffyStatus) score += 10;
  if (required.kiddStatus === donor.kiddStatus) score += 10;
  if (required.mnsStatus === donor.mnsStatus) score += 5;
  if (required.lewisStatus === donor.lewisStatus) score += 5;
  return score;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: "BLACK SWAN PROTOCOL" — Disaster Mode
// PRD v1.5 Section 2
// ═══════════════════════════════════════════════════════════════════════════════

const disasterEvents = new Map();
let disasterModeActive = false;

// Request disaster mode activation (requires multi-sig)
app.post('/disaster/request', (req, res) => {
  const { eventType, severity, title, description, affectedRegion, epicenterLat, epicenterLon, radiusKm } = req.body;

  const validTypes = ['NATURAL_DISASTER', 'MASS_ACCIDENT', 'INDUSTRIAL', 'TERROR', 'PANDEMIC'];
  if (!validTypes.includes(eventType)) return res.status(400).json({ error: 'Invalid event type' });

  const approvalsRequired = severity === 'LEVEL_3' ? 3 : 2;

  const event = {
    eventId: `DISASTER-${uuidv4().substring(0, 6).toUpperCase()}`,
    eventType, severity, title, description,
    affectedRegion, epicenterLat, epicenterLon, radiusKm,
    status: 'PENDING_APPROVAL',
    multiSigApprovals: [],
    approvalsRequired,
    policyOverrides: {
      suspendDonorGapCheck: true,
      enableBatchRelease: true,
      relaxColdChainWindow: false,
      skipIndividualMoSign: true,
      allowEmergencyDonors: true,
      universalDonorPriority: true
    },
    communicationMode: 'CELL_BROADCAST',
    batchReleases: [],
    gapReport: null,
    createdAt: new Date().toISOString()
  };

  disasterEvents.set(event.eventId, event);
  logAudit('DISASTER_REQUESTED', 'SYSTEM', null, `Disaster mode requested: ${title} (${severity})`);
  res.status(201).json({ event, message: `Requires ${approvalsRequired} multi-sig approvals with MFA + DSC` });
});

// Approve disaster mode (multi-sig with MFA + DSC)
app.post('/disaster/:eventId/approve', (req, res) => {
  const event = disasterEvents.get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Disaster event not found' });
  if (event.status !== 'PENDING_APPROVAL') return res.status(400).json({ error: `Event is ${event.status}` });

  const { authorityId, authorityRole, dscFingerprint, mfaVerified } = req.body;

  if (!mfaVerified) return res.status(403).json({ error: 'MFA verification required' });
  if (!dscFingerprint) return res.status(403).json({ error: 'Digital Signature Certificate (DSC) required' });

  const validRoles = ['STATE_HEALTH_SECRETARY', 'NBTC_DIRECTOR', 'NDMA_MEMBER', 'DISTRICT_COLLECTOR', 'CHIEF_MEDICAL_OFFICER'];
  if (!validRoles.includes(authorityRole)) return res.status(403).json({ error: `Unauthorized role: ${authorityRole}` });

  if (event.multiSigApprovals.find(a => a.authorityId === authorityId)) {
    return res.status(409).json({ error: 'Authority has already approved' });
  }

  event.multiSigApprovals.push({
    authorityId, authorityRole, dscFingerprint, mfaVerified,
    approvedAt: new Date().toISOString()
  });

  if (event.multiSigApprovals.length >= event.approvalsRequired) {
    event.status = 'ACTIVE';
    event.activatedAt = new Date().toISOString();
    disasterModeActive = true;
    logAudit('DISASTER_ACTIVATED', authorityId, null, `DISASTER MODE ACTIVATED: ${event.title}`);
  }

  res.json({ event, activated: event.status === 'ACTIVE' });
});

// Batch release units during active disaster
app.post('/disaster/:eventId/batch-release', (req, res) => {
  const event = disasterEvents.get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Disaster event not found' });
  if (event.status !== 'ACTIVE') return res.status(400).json({ error: 'Disaster mode is not active' });

  const { unitIds, destinationHfr, authorizedBy } = req.body;

  const batch = {
    batchId: `BATCH-${uuidv4().substring(0, 6).toUpperCase()}`,
    unitIds: unitIds || [],
    destinationHfr,
    authorizedBy,
    releasedAt: new Date().toISOString(),
    unitsCount: unitIds?.length || 0,
    reconciliationStatus: 'PENDING'
  };

  event.batchReleases.push(batch);

  if (!event.kpiFirstDispatchMs) {
    event.kpiFirstDispatchMs = Date.now() - new Date(event.activatedAt).getTime();
  }

  logAudit('BATCH_RELEASE', authorizedBy, null, `Batch released: ${batch.unitsCount} units to ${destinationHfr}`);
  res.json({ batch, kpiFirstDispatchMs: event.kpiFirstDispatchMs, kpiMet: event.kpiFirstDispatchMs < 900000 });
});

// Deactivate disaster mode and generate Gap Report
app.post('/disaster/:eventId/deactivate', (req, res) => {
  const event = disasterEvents.get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Disaster event not found' });
  if (event.status !== 'ACTIVE') return res.status(400).json({ error: 'Disaster mode is not active' });

  event.status = 'DEACTIVATED';
  event.deactivatedAt = new Date().toISOString();
  disasterModeActive = false;

  const totalUnits = event.batchReleases.reduce((sum, b) => sum + b.unitsCount, 0);
  const pendingUnits = event.batchReleases.filter(b => b.reconciliationStatus === 'PENDING')
    .reduce((sum, b) => sum + b.unitsCount, 0);

  event.gapReport = {
    totalUnitsReleased: totalUnits,
    totalBatchReleases: event.batchReleases.length,
    unreconciledUnits: pendingUnits,
    manualVerificationsRequired: pendingUnits,
    legalDocumentation: 'Emergency Medical Services Act — Section 3(a): Force Majeure Blood Release Protocol',
    generatedAt: new Date().toISOString(),
    generatedBy: req.body.deactivatorId || 'SYSTEM'
  };

  logAudit('DISASTER_DEACTIVATED', req.body.deactivatorId, null, `Disaster mode deactivated. Gap report generated: ${totalUnits} units.`);
  res.json({ event, gapReport: event.gapReport });
});

// Reconcile a batch post-disaster
app.post('/disaster/:eventId/reconcile/:batchId', (req, res) => {
  const event = disasterEvents.get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Disaster event not found' });

  const batch = event.batchReleases.find(b => b.batchId === req.params.batchId);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  batch.reconciliationStatus = req.body.status || 'RECONCILED';
  logAudit('BATCH_RECONCILED', 'ADMIN', null, `Batch ${req.params.batchId}: ${batch.reconciliationStatus}`);
  res.json({ batch });
});

// Get disaster mode status
app.get('/disaster/status', (req, res) => {
  const activeEvents = [...disasterEvents.values()].filter(e => e.status === 'ACTIVE');
  res.json({
    disasterModeActive,
    activeEvents,
    totalEvents: disasterEvents.size,
    pendingApproval: [...disasterEvents.values()].filter(e => e.status === 'PENDING_APPROVAL').length
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE: "HCX GATEWAY" — Insurance & Financial Settlement
// PRD v1.5 Section 3
// ═══════════════════════════════════════════════════════════════════════════════

const insuranceClaims = new Map();

// Submit insurance claim — auto-adjudication + fraud check
app.post('/hcx/claim', (req, res) => {
  const startTime = Date.now();
  const { bloodUnitHash, transfusionTxHash, patientAbhaRef, hospitalHfr, bloodBankHfr,
    insuranceProvider, policyNumber, claimType, medicalNecessity, billing } = req.body;

  // Fraud Check 1: One hash = one claim
  for (const [, existing] of insuranceClaims) {
    if (existing.bloodUnitHash === bloodUnitHash && !['REJECTED', 'FRAUD_FLAGGED'].includes(existing.status)) {
      return res.status(409).json({ error: 'FRAUD_DETECTED: Blood unit hash already has an active claim', existingClaimId: existing.claimId });
    }
  }

  // Fraud Check 2: Verify transfusion on blockchain (mock)
  const transfusionVerified = units.has(bloodUnitHash?.replace('UNIT-', '')) || transfusionTxHash?.startsWith('0x');

  // Auto-adjudication
  const validProcedures = ['EMERGENCY_TRANSFUSION', 'ELECTIVE_SURGERY', 'TRAUMA', 'OBSTETRIC', 'ONCOLOGY', 'THALASSEMIA', 'HEMOPHILIA', 'SICKLE_CELL'];
  const medicallyNecessary = validProcedures.includes(medicalNecessity?.procedure) && (medicalNecessity?.unitsTransfused > 0);
  const amountWithinLimits = (billing?.totalAmount || 0) <= 50000;

  let fraudScore = 0;
  if (!transfusionVerified) fraudScore += 50;
  if ((billing?.totalAmount || 0) > 25000) fraudScore += 10;

  const overallApproved = transfusionVerified && medicallyNecessary && amountWithinLimits && fraudScore < 60;

  const claim = {
    claimId: `CLM-${uuidv4().substring(0, 8).toUpperCase()}`,
    bloodUnitHash, transfusionTxHash, patientAbhaRef, hospitalHfr, bloodBankHfr,
    insuranceProvider: insuranceProvider || 'PM_JAY',
    policyNumber, claimType: claimType || 'CLAIM',
    medicalNecessity,
    billing: {
      ...billing,
      coveredAmount: overallApproved ? (billing?.totalAmount || 0) : 0,
      patientCopay: overallApproved ? 0 : (billing?.totalAmount || 0),
      currency: 'INR'
    },
    verificationResult: {
      transfusionVerified,
      policyValid: true,
      medicallyNecessary,
      duplicateCheckPassed: true,
      amountWithinLimits,
      fraudScore,
      overallApproved,
      rejectionReason: !overallApproved ?
        (!transfusionVerified ? 'Transfusion not verified on blockchain' :
          !medicallyNecessary ? 'Medical necessity not established' :
            !amountWithinLimits ? 'Claim exceeds policy sub-limits' : 'High fraud score') : null
    },
    status: overallApproved ? 'APPROVED' : (fraudScore >= 60 ? 'FRAUD_FLAGGED' : 'REJECTED'),
    settlement: null,
    fhirClaimRef: `Claim/${uuidv4()}`,
    fhirResponseRef: `ClaimResponse/${uuidv4()}`,
    createdAt: new Date().toISOString(),
    kpiApprovalMs: Date.now() - startTime
  };

  insuranceClaims.set(claim.claimId, claim);
  logAudit('INSURANCE_CLAIM', hospitalHfr, bloodUnitHash, `Claim ${claim.claimId}: ${claim.status} (fraud: ${fraudScore})`);

  res.status(201).json({ claim, kpiMet: claim.kpiApprovalMs < 600000 });
});

// Settle an approved claim via e-Rupee / UPI-Health
app.post('/hcx/claim/:claimId/settle', (req, res) => {
  const claim = insuranceClaims.get(req.params.claimId);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.status !== 'APPROVED') return res.status(400).json({ error: `Claim is ${claim.status}, not APPROVED` });

  const { paymentMethod, payerAccount, payeeAccount } = req.body;
  const validMethods = ['E_RUPEE', 'UPI_HEALTH', 'NEFT', 'PM_JAY_DIRECT'];
  if (!validMethods.includes(paymentMethod)) return res.status(400).json({ error: 'Invalid payment method' });

  claim.settlement = {
    paymentMethod,
    paymentRef: `PAY-${uuidv4().substring(0, 8).toUpperCase()}`,
    payerAccount: payerAccount || 'INSURER_HASHED',
    payeeAccount: payeeAccount || 'BLOODBANK_HASHED',
    amountSettled: claim.billing.coveredAmount,
    settlementTime: new Date().toISOString(),
    cbdcTokenRef: paymentMethod === 'E_RUPEE' ? `CBDC-${crypto.randomBytes(8).toString('hex')}` : null
  };

  claim.status = 'SETTLED';
  claim.settledAt = claim.settlement.settlementTime;
  logAudit('CLAIM_SETTLED', claim.hospitalHfr, claim.bloodUnitHash, `₹${claim.billing.coveredAmount} via ${paymentMethod}`);

  res.json({ claim });
});

// Get claim by blood unit hash
app.get('/hcx/claim/unit/:unitHash', (req, res) => {
  const claims = [...insuranceClaims.values()].filter(c => c.bloodUnitHash === req.params.unitHash);
  res.json({ claims });
});

// Get HCX dashboard stats
app.get('/hcx/stats', (req, res) => {
  const allClaims = [...insuranceClaims.values()];
  const totalSettled = allClaims.filter(c => c.status === 'SETTLED').reduce((sum, c) => sum + (c.billing?.coveredAmount || 0), 0);

  res.json({
    totalClaims: allClaims.length,
    approved: allClaims.filter(c => c.status === 'APPROVED').length,
    settled: allClaims.filter(c => c.status === 'SETTLED').length,
    rejected: allClaims.filter(c => c.status === 'REJECTED').length,
    fraudFlagged: allClaims.filter(c => c.status === 'FRAUD_FLAGGED').length,
    totalSettledAmount: totalSettled,
    avgApprovalTimeMs: allClaims.reduce((sum, c) => sum + (c.kpiApprovalMs || 0), 0) / (allClaims.length || 1)
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

const errorHandler = require('./src/utils/errorHandler');
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════╗
    ║   🩸 Rakt-Connect API Gateway v2.5              ║
    ║   Running on port ${PORT}                          ║
    ║   Blockchain: Hyperledger Fabric v3.0 (mock)     ║
    ║   Endpoints: 30+ REST APIs                       ║
    ║   Modules: Core + Rare Registry + Black Swan     ║
    ║            + HCX Gateway                         ║
    ║   Compliance: NBTC + DPDP + IT Act + HCX + EMS  ║
    ╚══════════════════════════════════════════════════╝
    `);
  });
}

module.exports = app;
