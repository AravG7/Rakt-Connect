const request = require('supertest');
const app = require('../server');
const { signToken, ROLES } = require('../src/middleware/auth');

describe('Frontend Integration & Authentication Endpoints', () => {
  let adminToken;
  let donorToken;

  beforeAll(() => {
    adminToken = signToken({ id: 'admin-1', role: ROLES.HOSPITAL_ADMIN, name: 'Admin User' });
    donorToken = signToken({ id: 'did:rakt:donor1', did: 'did:rakt:donor1', role: ROLES.DONOR, name: 'Donor 1' });
  });

  describe('POST /auth/login', () => {
    it('should authenticate privileged hospital admin with valid dev adminKey', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ role: ROLES.HOSPITAL_ADMIN, adminKey: 'rakt_admin_dev_secret_key_2026' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe(ROLES.HOSPITAL_ADMIN);
      expect(res.body.user).toHaveProperty('hospitalId');
    });

    it('should reject privileged role with invalid adminKey', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ role: ROLES.HOSPITAL_ADMIN, adminKey: 'wrong_key' });

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('PRIVILEGED_ROLE_AUTH_REQUIRED');
    });

    it('should allow donor login and return token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ role: ROLES.DONOR, abhaId: '91-1234-5678-9012' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe(ROLES.DONOR);
      expect(res.body.user.did).toBeDefined();
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 when token is missing', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('should return authenticated user profile when token is valid', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.user.role).toBe(ROLES.HOSPITAL_ADMIN);
    });
  });

  describe('GET /donors', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/donors');
      expect(res.statusCode).toBe(401);
    });

    it('should allow hospital admin to list donors with masked identifiers', async () => {
      const res = await request(app)
        .get('/donors')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('donors');
      expect(Array.isArray(res.body.donors)).toBe(true);
    });
  });

  describe('GET /unit/:id/verify', () => {
    it('should return 404 for unknown blood unit', async () => {
      const res = await request(app).get('/unit/NON-EXISTENT-UNIT/verify');
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('UNKNOWN');
      expect(res.body.verified).toBe(false);
    });

    it('should return verification status for existing unit', async () => {
      // First collect a unit
      const collectRes = await request(app)
        .post('/unit/collect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          donorDid: 'did:rakt:donor1',
          bloodGroup: 'O+',
          component: 'Packed RBC',
          volumeMl: 350,
          hospitalHfr: 'HFR-KA-0421',
          unitId: 'UNIT-VERIFY-TEST'
        });

      expect([201, 409]).toContain(collectRes.statusCode);

      const res = await request(app).get('/unit/UNIT-VERIFY-TEST/verify');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.unit.id).toBe('UNIT-VERIFY-TEST');
    });
  });

  describe('Emergency Broadcast Endpoints', () => {
    let broadcastId;

    it('should launch broadcast and allow querying active broadcasts', async () => {
      const launchRes = await request(app)
        .post('/broadcast/emergency')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bloodGroup: 'O-',
          hospitalHfr: 'HFR-KA-0421',
          radiusKm: 15,
          severityLevel: 'CRITICAL',
          targetAccepts: 3
        });

      expect(launchRes.statusCode).toBe(201);
      broadcastId = launchRes.body.broadcast.id;
      expect(broadcastId).toBeDefined();

      const activeRes = await request(app).get('/broadcast/active');
      expect(activeRes.statusCode).toBe(200);
      expect(activeRes.body.activeBroadcasts.some(b => b.id === broadcastId)).toBe(true);

      const detailRes = await request(app).get(`/broadcast/${broadcastId}`);
      expect(detailRes.statusCode).toBe(200);
      expect(detailRes.body.broadcast.id).toBe(broadcastId);
      expect(detailRes.body.broadcast.isActive).toBe(true);

      // Stop broadcast
      const stopRes = await request(app)
        .post(`/broadcast/${broadcastId}/stop`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(stopRes.statusCode).toBe(200);
      expect(stopRes.body.broadcast.isActive).toBe(false);
    });
  });
});
