const ApiError = require('../utils/ApiError');

// Validates req.body / req.query / req.params against a Joi schema
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, ''),
    }));
    return next(new ApiError(400, 'Validation failed', details));
  }

  req[property] = value;
  next();
};

module.exports = validate;
