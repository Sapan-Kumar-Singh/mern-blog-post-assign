const sendSuccess = (res, { statusCode = 200, message, data, meta } = {}) =>
  res.status(statusCode).json({ success: true, message, data, meta });

module.exports = { sendSuccess };
