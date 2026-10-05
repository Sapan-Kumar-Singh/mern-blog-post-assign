const express = require('express');

const adminController = require('../../controllers/admin.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const logActivity = require('../../middleware/activityLogger');
const { idParamSchema } = require('../../validators/common.validator');
const { updateUserSchema, listUsersSchema } = require('../../validators/user.validator');
const { adminListPostsSchema } = require('../../validators/post.validator');

const router = express.Router();

// Every admin route requires a valid token AND the admin role
router.use(authenticate, authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/activity', adminController.getActivity);

router.get('/users', validate(listUsersSchema, 'query'), adminController.listUsers);
router.patch(
  '/users/:id',
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  logActivity('admin:user-update'),
  adminController.updateUser
);
router.delete('/users/:id', validate(idParamSchema, 'params'), logActivity('admin:user-delete'), adminController.deleteUser);

router.get('/posts', validate(adminListPostsSchema, 'query'), adminController.listPosts);
router.patch(
  '/posts/:id/restore',
  validate(idParamSchema, 'params'),
  logActivity('admin:post-restore'),
  adminController.restorePost
);

module.exports = router;
