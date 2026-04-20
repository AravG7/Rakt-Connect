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
});
