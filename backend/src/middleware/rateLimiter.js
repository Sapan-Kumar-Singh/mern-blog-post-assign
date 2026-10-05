const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const createLimiter = ({ windowMinutes, max, message }) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler: (req, res, next) => next(new ApiError(429, message)),
  });

// Strict limit for login/register to slow down brute force attempts
const loginLimiter = createLimiter({
  windowMinutes: 15,
  max: 10,
  message: 'Too many login attempts, please try again after 15 minutes',
});

// Looser limit for the rest of the auth routes (refresh runs on every page load)
const authLimiter = createLimiter({
  windowMinutes: 15,
  max: 100,
  message: 'Too many requests, please try again later',
});

module.exports = { loginLimiter, authLimiter };
