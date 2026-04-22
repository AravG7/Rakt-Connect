const request = require('supertest');
const app = require('./server');

async function debug() {
  const res = await request(app)
    .get('/ai/predict/HFR-KA-001?bloodGroup=O-')
    .set('x-forwarded-proto', 'https');
  
  console.log('Status:', res.statusCode);
  console.log('Body:', JSON.stringify(res.body, null, 2));
}

debug();
