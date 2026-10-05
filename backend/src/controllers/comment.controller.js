const commentService = require('../services/comment.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const listComments = asyncHandler(async (req, res) => {
  const { comments, meta } = await commentService.listComments(req.params.postId, req.query);
  sendSuccess(res, { data: comments, meta });
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(req.params.postId, req.user, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Comment added', data: comment });
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(req.params.id, req.user, req.body);
  sendSuccess(res, { message: 'Comment updated', data: comment });
});

const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment(req.params.id, req.user);
  sendSuccess(res, { message: 'Comment deleted' });
});

module.exports = { listComments, createComment, updateComment, deleteComment };
