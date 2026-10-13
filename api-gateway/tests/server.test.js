const request = require('supertest');
const app = require('../server');
const { signToken, ROLES } = require('../src/middleware/auth');
const PQCVault = require('../src/crypto/pqcVault');
const H3Router = require('../src/routing/h3Router');
const FHIRMapper = require('../src/fhir/mapper');
const FHIRValidator = require('../src/fhir/validator');

describe('Rakt-Connect API Gateway', () => {
  let adminToken;
  let labTechToken;
  let moToken;
  let donorToken;
  let otherDonorToken;
  let testDonorDid;

  beforeAll(() => {
    adminToken = signToken({ id: 'admin-1', role: ROLES.HOSPITAL_ADMIN, name: 'Admin User' });
    labTechToken = signToken({ id: 'lab-1', role: ROLES.LAB_TECH, name: 'Lab Tech 1' });
    moToken = signToken({ id: 'mo-1', role: ROLES.MEDICAL_OFFICER, name: 'Dr. Sharma' });
    testDonorDid = 'did:rakt:testdonor1';
    donorToken = signToken({ id: 'donor-1', did: testDonorDid, role: ROLES.DONOR, name: 'Test Donor' });
    otherDonorToken = signToken({ id: 'donor-2', did: 'did:rakt:otherdonor2', role: ROLES.DONOR, name: 'Other Donor' });
  });

  // 1. Health check
  it('GET /health - should return operational status and accurately describe Fabric v2.5 LTS', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'operational');
    expect(res.body.blockchain).toContain('Fabric v2.5 LTS');
    expect(res.body).toHaveProperty('pqcVault');
    expect(res.body).toHaveProperty('spatialRouting');
  });

  // 2. Authentication & Authorization Controls
  describe('Authentication and Authorization Controls', () => {
    it('POST /auth/token - should generate a valid JWT token', async () => {
      const res = await request(app)
        .post('/auth/token')
        .send({ userId: 'user-001', role: ROLES.LAB_TECH });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toEqual('LAB_TECH');
    });

    it('GET /donor/:did - should return 401 when unauthenticated', async () => {
      const res = await request(app).get(`/donor/${testDonorDid}`);
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('code', 'AUTH_TOKEN_MISSING');
    });

    it('POST /donor/register - should create a new donor with explicit DPDP consent', async () => {
      const donorData = {
        name: 'Test Donor',
        bloodGroup: 'O+',
        abhaId: '12-3456-7890-1234',
        consentGiven: true
      };
      const res = await request(app).post('/donor/register').send(donorData);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body.donor).toHaveProperty('did');
      expect(res.body.donor.bloodGroup).toEqual('O+');
      expect(res.body.donor.consentRecorded).toBe(true);
    });

    it('POST /donor/register - should fail when explicit consent is denied', async () => {
      const res = await request(app).post('/donor/register').send({
        name: 'No Consent Donor',
        bloodGroup: 'A+',
        abhaId: '99-8888-7777-6666',
        consentGiven: false
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('DPDP Act 2023');
    });

    it('POST /donor/register - should fail without required fields', async () => {
      const res = await request(app).post('/donor/register').send({ name: 'Incomplete' });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });

    it('GET /donor/:did - should return 403 when another donor attempts unauthorized access', async () => {
      // First register the donor
      const regRes = await request(app).post('/donor/register').send({
        name: 'Private Donor',
        bloodGroup: 'B+',
        abhaId: '11-2222-3333-4444',
        consentGiven: true
      });
      const registeredDid = regRes.body.donor.did;

      // Other donor tries to read it
      const res = await request(app)
        .get(`/donor/${registeredDid}`)
        .set('Authorization', `Bearer ${otherDonorToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.code).toEqual('DONOR_ACCESS_UNAUTHORIZED');
    });

    it('GET /donor/:did - should allow clinical staff (Medical Officer) to access with audit', async () => {
      const regRes = await request(app).post('/donor/register').send({
        name: 'Clinical Patient',
        bloodGroup: 'AB+',
        abhaId: '55-6666-7777-8888',
        consentGiven: true
      });
      const did = regRes.body.donor.did;

      const res = await request(app)
        .get(`/donor/${did}`)
        .set('Authorization', `Bearer ${moToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.did).toEqual(did);
    });
  });

  // 3. Safe Blood Unit Rules
  describe('Safe Blood-Unit Rules & Validations', () => {
    let testUnitId;

    it('POST /unit/collect - should tokenize unit and validate component expiry', async () => {
      const res = await request(app)
        .post('/unit/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donorDid: 'did:rakt:donor1',
          bloodGroup: 'O+',
          component: 'WholeBlood',
          volumeMl: 350,
          hospitalHfr: 'HFR-KA-001'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.unit).toHaveProperty('id');
      expect(res.body.unit.state).toEqual('COLLECTED');
      expect(res.body.unit.daysToExpiry).toEqual(35); // Whole blood 35 days
      testUnitId = res.body.unit.id;
    });

    it('POST /unit/collect - should reject duplicate units', async () => {
      const res = await request(app)
        .post('/unit/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          unitId: testUnitId,
          donorDid: 'did:rakt:donor1',
          bloodGroup: 'O+',
          component: 'WholeBlood',
          volumeMl: 350
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toContain('Duplicate unit');
    });

    it('POST /unit/collect - should reject invalid component and volume', async () => {
      const res = await request(app)
        .post('/unit/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donorDid: 'did:rakt:donor1',
          bloodGroup: 'O+',
          component: 'InvalidBloodComponent',
          volumeMl: 10
        });

      expect(res.statusCode).toEqual(400);
    });

    it('POST /unit/test-result - should reject unverified lab credentials', async () => {
      const res = await request(app)
        .post('/unit/test-result')
        .set('Authorization', `Bearer ${labTechToken}`)
        .send({
          unitId: testUnitId,
          isSafe: true,
          signatureHash: 'short' // < 16 chars
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('Unverified lab submission');
    });

    it('POST /unit/test-result - should approve safe unit with verified lab credentials', async () => {
      const res = await request(app)
        .post('/unit/test-result')
        .set('Authorization', `Bearer ${labTechToken}`)
        .send({
          unitId: testUnitId,
          isSafe: true,
          signatureHash: 'abcdef0123456789abcdef0123456789',
          labLicenseNo: 'NABL-LAB-KA-100',
          screeningResults: {
            hiv: 'NEGATIVE',
            hbsag: 'NEGATIVE',
            hcv: 'NEGATIVE',
            malaria: 'NEGATIVE',
            syphilis: 'NEGATIVE'
          },
          hb: 13.5
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.unit.state).toEqual('APPROVED');
      expect(res.body.unit.labIsSafe).toBe(true);
    });
  });

  // 4. Disaster Mode Controls
  describe('Disaster Mode Multi-Sig & State Controls', () => {
    let eventId;

    it('POST /disaster/request - should request disaster mode requiring multi-sig', async () => {
      const res = await request(app)
        .post('/disaster/request')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventType: 'NATURAL_DISASTER',
          severity: 'LEVEL_2',
          title: 'Flood Mass Casualty Event',
          affectedRegion: 'Bengaluru East',
          radiusKm: 25
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.event).toHaveProperty('eventId');
      expect(res.body.event.approvalsRequired).toEqual(2);
      eventId = res.body.event.eventId;
    });

    it('POST /disaster/:eventId/approve - should reject duplicate signer approvals', async () => {
      // First approval
      const firstRes = await request(app)
        .post(`/disaster/${eventId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          authorityId: 'AUTH-SEC-01',
          authorityRole: 'STATE_HEALTH_SECRETARY',
          dscFingerprint: '0123456789abcdef0123456789abcdef',
          mfaVerified: true
        });
      expect(firstRes.statusCode).toEqual(200);
      expect(firstRes.body.activated).toBe(false);

      // Duplicate approval attempt by same authority
      const dupRes = await request(app)
        .post(`/disaster/${eventId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          authorityId: 'AUTH-SEC-01',
          authorityRole: 'STATE_HEALTH_SECRETARY',
          dscFingerprint: '0123456789abcdef0123456789abcdef',
          mfaVerified: true
        });
      expect(dupRes.statusCode).toEqual(409);
      expect(dupRes.body.error).toContain('already submitted');
    });

    it('POST /disaster/:eventId/approve - should activate disaster upon 2nd distinct authorized approval', async () => {
      const secondRes = await request(app)
        .post(`/disaster/${eventId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          authorityId: 'AUTH-NBTC-02',
          authorityRole: 'NBTC_DIRECTOR',
          dscFingerprint: 'fedcba9876543210fedcba9876543210',
          mfaVerified: true
        });

      expect(secondRes.statusCode).toEqual(200);
      expect(secondRes.body.activated).toBe(true);
      expect(secondRes.body.distinctApprovalsCount).toEqual(2);
    });

    it('POST /disaster/:eventId/batch-release - should protect unit state against compromised units', async () => {
      // Create a unit and mark it REJECTED
      const createRes = await request(app)
        .post('/unit/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donorDid: 'did:rakt:donor1',
          bloodGroup: 'B-',
          component: 'Packed RBC',
          volumeMl: 350
        });
      const rejUnitId = createRes.body.unit.id;

      await request(app)
        .post('/unit/test-result')
        .set('Authorization', `Bearer ${labTechToken}`)
        .send({
          unitId: rejUnitId,
          isSafe: false,
          signatureHash: 'abcdef0123456789abcdef0123456789',
          screeningResults: { hiv: 'POSITIVE', hbsag: 'NEGATIVE', hcv: 'NEGATIVE', malaria: 'NEGATIVE', syphilis: 'NEGATIVE' }
        });

      // Attempt emergency release of rejected unit
      const releaseRes = await request(app)
        .post(`/disaster/${eventId}/batch-release`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          unitIds: [rejUnitId],
          destinationHfr: 'HFR-KA-999'
        });

      expect(releaseRes.statusCode).toEqual(400);
      expect(releaseRes.body.error).toContain('None of the requested units were eligible');
    });
  });

  // 5. Post-Quantum Cryptographic Vault & H3 Routing
  describe('Cryptographic Vault & Spatial Routing Integrations', () => {
    it('PQCVault - should encapsulate ML-KEM-768 shared secret and encrypt/decrypt with AES-256-GCM', () => {
      const keyPair = PQCVault.generateKeyPair();
      expect(keyPair.publicKey.length).toEqual(1184);

      const secretPayload = 'PATIENT_CONFIDENTIAL_HEALTH_DATA_ABHA_RH_NULL';
      const vault = PQCVault.encryptVault(secretPayload, keyPair.publicKey, 'DPDP_SECTION_43A');

      expect(vault.algorithm).toContain('ML-KEM-768');
      expect(vault).toHaveProperty('ciphertext');
      expect(vault).toHaveProperty('iv');
      expect(vault).toHaveProperty('tag');

      const decrypted = PQCVault.decryptVault(vault, keyPair.privateKey);
      expect(decrypted).toEqual(secretPayload);
    });

    it('H3Router - should compute spatial hex indices, calculate Haversine distance and rank facilities', () => {
      const originLat = 12.9116;
      const originLon = 77.6474;
      const h3Index = H3Router.geoToH3Index(originLat, originLon, 7);
      expect(h3Index).toMatch(/^87/);

      const dist = H3Router.haversineKm(12.9116, 77.6474, 12.9343, 77.6101);
      expect(dist).toBeGreaterThan(0);
      expect(dist).toBeLessThan(10);

      const dispatch = H3Router.rankDispatchCandidates(
        { lat: originLat, lon: originLon },
        [
          { id: 'H1', name: 'Near Hospital', lat: 12.915, lon: 77.645, stock: 5 },
          { id: 'H2', name: 'Far Hospital', lat: 13.05, lon: 77.55, stock: 10 }
        ],
        2,
        'CRITICAL'
      );

      expect(dispatch.candidates.length).toEqual(2);
      expect(dispatch.candidates[0].id).toEqual('H1'); // Closer hospital ranks higher
    });
  });

  // 6. FHIR R4 Conformance & Validation
  describe('FHIR R4 Conformance and Profiles', () => {
    it('FHIRValidator - should flag invalid top-level bloodGroup on Patient as schema violation', () => {
      const invalidPatient = {
        resourceType: 'Patient',
        id: 'PT-001',
        bloodGroup: { coding: [{ code: 'O+' }] } // ILLEGAL FHIR R4
      };

      const result = FHIRValidator.validate(invalidPatient);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("'bloodGroup' is not a valid element of Patient"))).toBe(true);
    });

    it('FHIRMapper & FHIRValidator - should produce and validate compliant Patient and BiologicallyDerivedProduct', () => {
      const donor = {
        did: 'did:rakt:12345678',
        abhaId: '14-2391-8821-4902',
        bloodGroup: 'O+',
        name: 'Validated Donor'
      };

      const fhirPatient = FHIRMapper.donorToFHIR(donor);
      const patientValidation = FHIRValidator.validate(fhirPatient);
      expect(patientValidation.isValid).toBe(true);
      expect(fhirPatient.extension[0].url).toEqual('http://hl7.org/fhir/StructureDefinition/patient-bloodGroup');

      const unit = {
        id: 'UNIT-999',
        componentType: 'Packed RBC',
        state: 'Approved',
        donorHash: donor.did,
        collectionTime: '2026-10-13T10:00:00Z',
        lastTempReading: 4.0
      };

      const fhirProduct = FHIRMapper.bloodUnitToFHIR(unit);
      const productValidation = FHIRValidator.validate(fhirProduct);
      expect(productValidation.isValid).toBe(true);
      expect(fhirProduct.productCategory).toEqual('cells');
    });
  });

  // 7. Emergency Broadcast and AI routes
  describe('Emergency Broadcast & AI Proxy', () => {
    it('POST /broadcast/emergency - should activate EBM and return broadcast ID', async () => {
      const res = await request(app)
        .post('/broadcast/emergency')
        .send({ bloodGroup: 'B+', hospitalHfr: 'HFR-KA-001', radiusKm: 15, severityLevel: 'URGENT', targetAccepts: 2 });
      expect(res.statusCode).toEqual(201);
      expect(res.body.broadcast.id).toMatch(/^EBM-/);
    });

    it('GET /ai/predict/:hospitalId - should return demand prediction with heuristic baseline label', async () => {
      const res = await request(app).get('/ai/predict/HFR-KA-001?bloodGroup=O-');
      expect(res.statusCode).toEqual(200);
      expect(res.body.hospitalId).toBe('HFR-KA-001');
      expect(res.body).toHaveProperty('predictedDemandUnits');
      expect(res.body).toHaveProperty('integrationNote');
    });
  });
});
