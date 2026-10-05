const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const generateAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

// jti makes every refresh token unique, even when issued in the same second
const generateRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

const verifyAccessToken = (token) => verifyToken(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => verifyToken(token, process.env.JWT_REFRESH_SECRET);

// Only a hash of the refresh token is stored in the database
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
