const mongoose = require('mongoose');
const tokenService = require('../../src/services/token.service');
const ApiError = require('../../src/utils/ApiError');

describe('token.service', () => {
  const user = { _id: new mongoose.Types.ObjectId(), role: 'admin' };

  it('creates an access token containing the user id and role', () => {
    const token = tokenService.generateAccessToken(user);
    const payload = tokenService.verifyAccessToken(token);

    expect(payload.sub).toBe(user._id.toString());
    expect(payload.role).toBe('admin');
  });

  it('does not accept a refresh token as an access token', () => {
    const refreshToken = tokenService.generateRefreshToken(user);
    expect(() => tokenService.verifyAccessToken(refreshToken)).toThrow(ApiError);
  });

  it('generates a different refresh token every time', () => {
    expect(tokenService.generateRefreshToken(user)).not.toBe(tokenService.generateRefreshToken(user));
  });

  it('throws a 401 ApiError for an invalid token', () => {
    try {
      tokenService.verifyAccessToken('garbage');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    }
    expect.assertions(2);
  });

  it('hashes tokens consistently', () => {
    expect(tokenService.hashToken('abc')).toBe(tokenService.hashToken('abc'));
    expect(tokenService.hashToken('abc')).not.toBe('abc');
  });
});
