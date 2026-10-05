const ActivityLog = require('../models/ActivityLog');

// Records the action once the response is sent, and only if it succeeded.
// Controllers can set res.locals.userId (e.g. login) and res.locals.activityTarget.
const logActivity = (action) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    const userId = req.user?._id || res.locals.userId;
    if (!userId) return;

    ActivityLog.create({
      user: userId,
      action,
      method: req.method,
      path: req.originalUrl,
      target: res.locals.activityTarget,
      ip: req.ip,
    }).catch((err) => console.error('Failed to write activity log:', err.message));
  });

  next();
};

module.exports = logActivity;
