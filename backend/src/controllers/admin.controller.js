const adminService = require('../services/admin.service');
const userService = require('../services/user.service');
const postService = require('../services/post.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, { data: stats });
});

const getActivity = asyncHandler(async (req, res) => {
  const logs = await adminService.getRecentActivity();
  sendSuccess(res, { data: logs });
});

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.listUsers(req.query);
  sendSuccess(res, { data: users, meta });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.user, req.body);
  res.locals.activityTarget = user.email;
  sendSuccess(res, { message: 'User updated', data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user);
  sendSuccess(res, { message: 'User deleted' });
});

const listPosts = asyncHandler(async (req, res) => {
  const { posts, meta } = await postService.listAllPosts(req.query);
  sendSuccess(res, { data: posts, meta });
});

const restorePost = asyncHandler(async (req, res) => {
  const post = await postService.restorePost(req.params.id);
  res.locals.activityTarget = post.slug;
  sendSuccess(res, { message: 'Post restored', data: post });
});

module.exports = { getStats, getActivity, listUsers, updateUser, deleteUser, listPosts, restorePost };
