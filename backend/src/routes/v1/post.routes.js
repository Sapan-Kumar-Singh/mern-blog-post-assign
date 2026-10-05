const express = require('express');

const postController = require('../../controllers/post.controller');
const commentController = require('../../controllers/comment.controller');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const logActivity = require('../../middleware/activityLogger');
const { idParamSchema, paginationSchema } = require('../../validators/common.validator');
const { commentSchema } = require('../../validators/comment.validator');
const {
  createPostSchema,
  updatePostSchema,
  listPostsSchema,
  slugParamSchema,
  postIdParamSchema,
} = require('../../validators/post.validator');

const router = express.Router();

router
  .route('/')
  .get(validate(listPostsSchema, 'query'), postController.listPosts)
  .post(authenticate, validate(createPostSchema), logActivity('post:create'), postController.createPost);

router.get('/:slug', validate(slugParamSchema, 'params'), postController.getPost);

// Ownership (or admin role) is checked in the post service
router.patch(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(updatePostSchema),
  logActivity('post:update'),
  postController.updatePost
);
router.delete(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  logActivity('post:delete'),
  postController.deletePost
);

// Comments nested under a post
router
  .route('/:postId/comments')
  .get(validate(postIdParamSchema, 'params'), validate(paginationSchema, 'query'), commentController.listComments)
  .post(
    authenticate,
    validate(postIdParamSchema, 'params'),
    validate(commentSchema),
    logActivity('comment:create'),
    commentController.createComment
  );

module.exports = router;
