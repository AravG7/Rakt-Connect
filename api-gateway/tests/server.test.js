const request = require('supertest');
const app = require('../server');

describe('Rakt-Connect API Gateway', () => {
  it('GET /health - should return operational status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'operational');
    expect(res.body).toHaveProperty('service');
  });

  it('POST /donor/register - should create a new donor with a DID', async () => {
    const donorData = {
      name: 'Test Donor',
      bloodGroup: 'O+',
      abhaId: '12-3456-7890-1234'
    };
    const res = await request(app).post('/donor/register').send(donorData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.donor).toHaveProperty('did');
    expect(res.body.donor.bloodGroup).toEqual('O+');
  });

  it('POST /donor/register - should fail without required fields', async () => {
    const invalidData = {
      name: 'Incomplete Donor'
    };
    const res = await request(app).post('/donor/register').send(invalidData);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /broadcast/emergency - should activate EBM and return a broadcast ID', async () => {
    const broadcastData = {
      bloodGroup: 'B+',
      hospitalHfr: 'HFR-KA-001',
      radiusKm: 15,
      severityLevel: 'URGENT',
      targetAccepts: 3
    };
    const res = await request(app)
      .post('/broadcast/emergency')
      .set('x-forwarded-proto', 'https') // Bypass enforceSSL
      .send(broadcastData);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.broadcast).toHaveProperty('id');
    expect(res.body.broadcast.id).toMatch(/^EBM-/);
    expect(res.body.broadcast.bloodGroup).toEqual('B+');
  });

  it('POST /broadcast/:id/respond - should record donor response with deviceId and timestamp', async () => {
    // First, create a broadcast
    const broadcastRes = await request(app)
      .post('/broadcast/emergency')
      .set('x-forwarded-proto', 'https')
      .send({ bloodGroup: 'A+', targetAccepts: 1 });
    
    const broadcastId = broadcastRes.body.broadcast.id;

    // Respond to it
    const responseData = {
      donorDid: 'did:rakt:test-donor-123',
      response: 'ACCEPT',
      deviceId: 'DEVICE-UNIT-TEST-001'
    };

    const res = await request(app)
      .post(`/broadcast/${broadcastId}/respond`)
      .set('x-forwarded-proto', 'https')
      .send(responseData);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('donorResponse', 'ACCEPT');
    expect(res.body).toHaveProperty('deviceId', 'DEVICE-UNIT-TEST-001');
    expect(res.body).toHaveProperty('timestamp');
    // Verify broadcast state updated
    expect(res.body.broadcast.acceptedDonors).toContain('did:rakt:test-donor-123');
    expect(res.body.broadcast.isActive).toBe(false); // Should be false because targetAccepts was 1
  });

  it('GET /ai/predict/:hospitalId - should return a blood shortage prediction', async () => {
    const res = await request(app)
      .get('/ai/predict/HFR-KA-001?bloodGroup=O-')
      .set('x-forwarded-proto', 'https');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.hospitalId).toBe('HFR-KA-001');
    expect(res.body).toHaveProperty('predictedDemandUnits');
    expect(res.body).toHaveProperty('warningLevel');
  });
});
