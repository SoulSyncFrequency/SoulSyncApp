// Jest + Supertest skeleton (adjust npm scripts to run tests)
import request from 'supertest';
import app from '../src/app'; // ensure default export

describe('Auth', () => {
  it('GET /auth/me without session should return null', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.body).toHaveProperty('user');
  });
});
