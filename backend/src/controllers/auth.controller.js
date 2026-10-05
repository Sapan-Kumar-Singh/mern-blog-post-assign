const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const REFRESH_COOKIE = 'refreshToken';

const refreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const sendAuthResponse = (res, { user, accessToken, refreshToken }, statusCode, message) => {
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.locals.userId = user._id;
  sendSuccess(res, { statusCode, message, data: { user, accessToken } });
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.locals.userId = user._id;
  sendSuccess(res, { statusCode: 201, message: 'Registration successful, please log in', data: user });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendAuthResponse(res, result, 200, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.cookies[REFRESH_COOKIE]);
  sendAuthResponse(res, result, 200, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  res.locals.userId = await authService.logout(req.cookies[REFRESH_COOKIE]);
  const { maxAge, ...clearOptions } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, clearOptions);
  sendSuccess(res, { message: 'Logged out successfully' });
});

const me = (req, res) => sendSuccess(res, { data: req.user });

// Passport has already verified the user; issue our own tokens and send them back to the client
const oauthCallback = asyncHandler(async (req, res) => {
  const { refreshToken } = await authService.issueTokens(req.user);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.redirect(`${process.env.CLIENT_URL}/oauth/success`);
});

module.exports = { register, login, refresh, logout, me, oauthCallback };
