const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const authService = require('../services/auth.service');

// Providers are only registered when their credentials exist in .env
const enabledProviders = new Set();

const verifyProfile = (provider) => async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await authService.findOrCreateSocialUser({
      provider,
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
};

const configurePassport = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, SERVER_URL } = process.env;

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `${SERVER_URL}/api/v1/auth/google/callback`,
        },
        verifyProfile('google')
      )
    );
    enabledProviders.add('google');
  }

  if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: FACEBOOK_APP_ID,
          clientSecret: FACEBOOK_APP_SECRET,
          callbackURL: `${SERVER_URL}/api/v1/auth/facebook/callback`,
          profileFields: ['id', 'displayName', 'emails', 'photos'],
        },
        verifyProfile('facebook')
      )
    );
    enabledProviders.add('facebook');
  }
};

module.exports = { configurePassport, enabledProviders };
