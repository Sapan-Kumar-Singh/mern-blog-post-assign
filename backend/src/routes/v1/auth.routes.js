const express = require('express');
const passport = require('passport');

const authController = require('../../controllers/auth.controller');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const logActivity = require('../../middleware/activityLogger');
const { loginLimiter, authLimiter } = require('../../middleware/rateLimiter');
const { registerSchema, loginSchema } = require('../../validators/auth.validator');
const { enabledProviders } = require('../../config/passport');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

router.use(authLimiter);

router.post('/register', loginLimiter, validate(registerSchema), logActivity('register'), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), logActivity('login'), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', logActivity('logout'), authController.logout);
router.get('/me', authenticate, authController.me);

// ----- OAuth 2.0 (Google / Facebook) -----

const ensureProviderEnabled = (provider) => (req, res, next) => {
  if (!enabledProviders.has(provider)) {
    return next(new ApiError(501, `${provider} login is not configured`));
  }
  next();
};

// On any OAuth failure send the user back to the login page instead of showing JSON
const handleOAuthCallback = (provider) => (req, res, next) => {
  passport.authenticate(provider, { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
    }
    req.user = user;
    next();
  })(req, res, next);
};

router.get(
  '/google',
  ensureProviderEnabled('google'),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  ensureProviderEnabled('google'),
  handleOAuthCallback('google'),
  logActivity('login:google'),
  authController.oauthCallback
);

router.get(
  '/facebook',
  ensureProviderEnabled('facebook'),
  passport.authenticate('facebook', { scope: ['email'], session: false })
);
router.get(
  '/facebook/callback',
  ensureProviderEnabled('facebook'),
  handleOAuthCallback('facebook'),
  logActivity('login:facebook'),
  authController.oauthCallback
);

module.exports = router;
