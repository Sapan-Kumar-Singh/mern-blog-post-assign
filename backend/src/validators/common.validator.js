const Joi = require('joi');

const objectId = Joi.string().hex().length(24).messages({ 'string.length': '{{#label}} must be a valid id' });

const idParamSchema = Joi.object({ id: objectId.required() });

const paginationFields = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
};

const paginationSchema = Joi.object(paginationFields);

module.exports = { objectId, idParamSchema, paginationFields, paginationSchema };
