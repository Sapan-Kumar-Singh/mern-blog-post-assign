const postService = require('../services/post.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const listPosts = asyncHandler(async (req, res) => {
  const { posts, meta } = await postService.listPosts(req.query);
  sendSuccess(res, { data: posts, meta });
});

const getPost = asyncHandler(async (req, res) => {
  const post = await postService.getPostBySlug(req.params.slug);
  sendSuccess(res, { data: post });
});

const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user._id, req.body);
  res.locals.activityTarget = post.slug;
  sendSuccess(res, { statusCode: 201, message: 'Post created', data: post });
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.params.id, req.user, req.body);
  res.locals.activityTarget = post.slug;
  sendSuccess(res, { message: 'Post updated', data: post });
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await postService.deletePost(req.params.id, req.user);
  res.locals.activityTarget = post.slug;
  sendSuccess(res, { message: 'Post deleted' });
});

module.exports = { listPosts, getPost, createPost, updatePost, deletePost };
