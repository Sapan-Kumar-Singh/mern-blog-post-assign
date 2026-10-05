const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');

const getDashboardStats = async () => {
  const [totalUsers, totalPosts, totalComments] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments({ isDeleted: false }),
    Comment.countDocuments(),
  ]);

  return { totalUsers, totalPosts, totalComments };
};

const getRecentActivity = async (limit = 20) =>
  ActivityLog.find().sort({ createdAt: -1 }).limit(limit).populate('user', 'name email').lean();

module.exports = { getDashboardStats, getRecentActivity };
