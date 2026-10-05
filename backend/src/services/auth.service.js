const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const tokenService = require('./token.service');

const issueTokens = async (user) => {
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken(user);

  await User.updateOne({ _id: user._id }, { refreshTokenHash: tokenService.hashToken(refreshToken) });

  return { accessToken, refreshToken };
};

const register = async ({ name, email, password }) => {
  const exists = await User.exists({ email });
  if (exists) {
    throw new ApiError(409, 'Email is already registered');
  }

  // Only creates the account - tokens are issued when the user logs in
  return User.create({ name, email, password });
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  // Same message for unknown email and wrong password
  if (!user || !user.password || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated');
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

// Refresh token rotation: every refresh issues a new pair and invalidates the old one
const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  const payload = tokenService.verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub).select('+refreshTokenHash');

  if (!user || !user.isActive || user.refreshTokenHash !== tokenService.hashToken(refreshToken)) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

// Returns the user id (if the token was valid) so the logout can be logged
const logout = async (refreshToken) => {
  if (!refreshToken) return null;

  try {
    const payload = tokenService.verifyRefreshToken(refreshToken);
    await User.updateOne({ _id: payload.sub }, { $unset: { refreshTokenHash: 1 } });
    return payload.sub;
  } catch (err) {
    return null;
  }
};

const findOrCreateSocialUser = async ({ provider, providerId, email, name, avatar }) => {
  const idField = provider === 'google' ? 'googleId' : 'facebookId';

  let user = await User.findOne({ [idField]: providerId });

  // Link the social account to an existing user with the same email
  if (!user && email) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user[idField] = providerId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
    }
  }

  if (!user) {
    if (!email) {
      throw new ApiError(400, `Your ${provider} account did not share an email address`);
    }
    user = await User.create({ name, email, avatar, [idField]: providerId });
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated');
  }

  return user;
};

module.exports = { issueTokens, register, login, refresh, logout, findOrCreateSocialUser };
