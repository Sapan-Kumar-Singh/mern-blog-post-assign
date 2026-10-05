const authService = require('../../src/services/auth.service');
const User = require('../../src/models/User');
const { createUser } = require('../helpers');

describe('auth.service.findOrCreateSocialUser', () => {
  const googleProfile = {
    provider: 'google',
    providerId: 'google-123',
    email: 'social@example.com',
    name: 'Social User',
  };

  it('creates a new user without a password', async () => {
    const user = await authService.findOrCreateSocialUser(googleProfile);

    expect(user.googleId).toBe('google-123');
    expect(user.role).toBe('user');
    const saved = await User.findById(user._id).select('+password');
    expect(saved.password).toBeUndefined();
  });

  it('returns the same user on the next login', async () => {
    const first = await authService.findOrCreateSocialUser(googleProfile);
    const second = await authService.findOrCreateSocialUser(googleProfile);

    expect(second._id.toString()).toBe(first._id.toString());
    expect(await User.countDocuments()).toBe(1);
  });

  it('links the provider to an existing account with the same email', async () => {
    const { user: existing } = await createUser({ email: 'social@example.com' });

    const user = await authService.findOrCreateSocialUser({ ...googleProfile, provider: 'facebook' });

    expect(user._id.toString()).toBe(existing._id.toString());
    expect(user.facebookId).toBe('google-123');
  });

  it('rejects a new social user without an email', async () => {
    await expect(authService.findOrCreateSocialUser({ ...googleProfile, email: undefined })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
