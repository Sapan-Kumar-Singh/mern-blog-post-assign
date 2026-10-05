const express = require('express');

const commentController = require('../../controllers/comment.controller');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const logActivity = require('../../middleware/activityLogger');
const { idParamSchema } = require('../../validators/common.validator');
const { commentSchema } = require('../../validators/comment.validator');

const router = express.Router();

router.use(authenticate);

router.patch('/:id', validate(idParamSchema, 'params'), validate(commentSchema), commentController.updateComment);
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  logActivity('comment:delete'),
  commentController.deleteComment
);

module.exports = router;
