const ApiError = require('./ApiError');

const isOwnerOrAdmin = (user, ownerId) =>
  user.role === 'admin' || ownerId?.toString() === user._id.toString();

const assertOwnerOrAdmin = (user, ownerId, message = 'You can only modify your own content') => {
  if (!isOwnerOrAdmin(user, ownerId)) {
    throw new ApiError(403, message);
  }
};

module.exports = { isOwnerOrAdmin, assertOwnerOrAdmin };
