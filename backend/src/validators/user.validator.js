const Joi = require('joi');
const { ROLES } = require('../models/User');
const { paginationFields } = require('./common.validator');

const updateUserSchema = Joi.object({
  role: Joi.string().valid(...ROLES),
  isActive: Joi.boolean(),
}).min(1);

const listUsersSchema = Joi.object({
  ...paginationFields,
  search: Joi.string().trim().max(100).allow(''),
});

module.exports = { updateUserSchema, listUsersSchema };
