const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { createUser, auth, getRefreshCookie } = require('../helpers');

const newUser = { name: 'John Doe', email: 'john@example.com', password: 'Password123' };

// Registers + logs in, returns the refresh cookie
const loginAsNewUser = async () => {
  await request(app).post('/api/v1/auth/register').send(newUser);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: newUser.email, password: newUser.password });
  return getRefreshCookie(res);
};

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registers a user and hashes the password without logging them in', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(newUser.email);
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.accessToken).toBeUndefined();
      expect(getRefreshCookie(res)).toBeUndefined();

      const saved = await User.findOne({ email: newUser.email }).select('+password');
      expect(saved.password).not.toBe(newUser.password);
    });

    it('ignores a role sent by the client', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...newUser, role: 'admin' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('user');
    });

    it('rejects a duplicate email with 409', async () => {
      await request(app).post('/api/v1/auth/register').send(newUser);
      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('returns validation details for an invalid payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'J', email: 'not-an-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
      const fields = res.body.error.details.map((d) => d.field);
      expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const { user } = await createUser({ email: 'jane@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane@example.com', password: 'Password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.user._id).toBe(user._id.toString());
      expect(res.body.data.accessToken).toBeDefined();
      expect(getRefreshCookie(res)).toBeDefined();
    });

    it('rejects a wrong password with 401', async () => {
      await createUser({ email: 'jane@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane@example.com', password: 'WrongPass1' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('rejects a deactivated user with 403', async () => {
      await createUser({ email: 'jane@example.com', isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'jane@example.com', password: 'Password123' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('issues a new access token and rotates the refresh token', async () => {
      const oldCookie = await loginAsNewUser();

      const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', oldCookie);
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();

      // The old refresh token can't be used again
      const reuse = await request(app).post('/api/v1/auth/refresh').set('Cookie', oldCookie);
      expect(reuse.status).toBe(401);
    });

    it('returns 401 when no refresh cookie is sent', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes the refresh token', async () => {
      const cookie = await loginAsNewUser();

      const logoutRes = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
      expect(logoutRes.status).toBe(200);

      const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
      expect(refreshRes.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request(app).get('/api/v1/auth/me').set(auth('invalid.token.value'));
      expect(res.status).toBe(401);
    });

    it('returns the current user for a valid token', async () => {
      const { user, token } = await createUser();
      const res = await request(app).get('/api/v1/auth/me').set(auth(token));

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(user.email);
    });
  });

  it('returns 501 for an OAuth provider that is not configured', async () => {
    const res = await request(app).get('/api/v1/auth/google');
    expect(res.status).toBe(501);
  });
});
