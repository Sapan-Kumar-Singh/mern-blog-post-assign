const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email role isActive avatar createdAt')
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, meta: buildPaginationMeta(page, limit, total) };
};

const updateUser = async (userId, currentUser, updates) => {
  // Prevents an admin from locking themselves out of the admin panel
  if (userId === currentUser._id.toString()) {
    throw new ApiError(400, 'You cannot change your own role or status');
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Force a deactivated user to log in again
  if (updates.isActive === false) {
    await User.updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1 } });
  }

  return user;
};

const deleteUser = async (userId, currentUser) => {
  if (userId === currentUser._id.toString()) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Posts are soft deleted (consistent with post deletion), comments are removed
  await Promise.all([
    Post.updateMany({ author: userId, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }),
    Comment.deleteMany({ author: userId }),
  ]);
};

module.exports = { listUsers, updateUser, deleteUser };
