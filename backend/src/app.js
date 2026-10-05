const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const { configurePassport } = require('./config/passport');
const v1Routes = require('./routes/v1');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

configurePassport();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/api/health', (req, res) => res.json({ success: true, message: 'OK' }));
app.use('/api/v1', v1Routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
