const Joi = require('joi');
const { objectId, paginationFields } = require('./common.validator');

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  content: Joi.string().trim().min(10).required(),
});

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150),
  content: Joi.string().trim().min(10),
}).min(1);

const listPostsSchema = Joi.object({
  ...paginationFields,
  author: objectId,
});

const adminListPostsSchema = Joi.object({
  ...paginationFields,
  status: Joi.string().valid('active', 'deleted', 'all').default('all'),
});

const slugParamSchema = Joi.object({
  slug: Joi.string().trim().max(200).required(),
});

const postIdParamSchema = Joi.object({ postId: objectId.required() });

module.exports = {
  createPostSchema,
  updatePostSchema,
  listPostsSchema,
  adminListPostsSchema,
  slugParamSchema,
  postIdParamSchema,
};
