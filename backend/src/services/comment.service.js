const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const { findActivePostOrFail } = require('./post.service');
const { assertOwnerOrAdmin } = require('../utils/permissions');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { notifyUser } = require('../socket');

const AUTHOR_FIELDS = 'name avatar';

const findCommentOrFail = async (commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }
  return comment;
};

const listComments = async (postId, query) => {
  await findActivePostOrFail(postId);
  const { page, limit, skip } = getPagination(query);

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS)
      .lean(),
    Comment.countDocuments({ post: postId }),
  ]);

  return { comments, meta: buildPaginationMeta(page, limit, total) };
};

const createComment = async (postId, user, { content }) => {
  const post = await findActivePostOrFail(postId);

  const comment = await Comment.create({ content, post: post._id, author: user._id });
  await comment.populate('author', AUTHOR_FIELDS);

  // Real-time notification to the post author (not when commenting on your own post)
  if (post.author.toString() !== user._id.toString()) {
    notifyUser(post.author, 'notification', {
      type: 'new-comment',
      message: `${user.name} commented on "${post.title}"`,
      postSlug: post.slug,
      createdAt: comment.createdAt,
    });
  }

  return comment;
};

const updateComment = async (commentId, user, { content }) => {
  const comment = await findCommentOrFail(commentId);
  assertOwnerOrAdmin(user, comment.author, 'You can only edit your own comments');

  comment.content = content;
  await comment.save();
  return comment.populate('author', AUTHOR_FIELDS);
};

const deleteComment = async (commentId, user) => {
  const comment = await findCommentOrFail(commentId);
  assertOwnerOrAdmin(user, comment.author, 'You can only delete your own comments');

  await comment.deleteOne();
};

module.exports = { listComments, createComment, updateComment, deleteComment };
