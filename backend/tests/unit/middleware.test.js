const Joi = require('joi');
const mongoose = require('mongoose');
const authorize = require('../../src/middleware/authorize');
const validate = require('../../src/middleware/validate');
const { errorHandler } = require('../../src/middleware/errorHandler');
const ApiError = require('../../src/utils/ApiError');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authorize middleware', () => {
  it('calls next() when the user has an allowed role', () => {
    const next = jest.fn();
    authorize('admin')({ user: { role: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes a 403 error when the role is not allowed', () => {
    const next = jest.fn();
    authorize('admin')({ user: { role: 'user' } }, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('passes a 401 error when there is no user', () => {
    const next = jest.fn();
    authorize('admin')({}, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});

describe('validate middleware', () => {
  const schema = Joi.object({ title: Joi.string().required() });

  it('replaces the body with the validated value and strips unknown fields', () => {
    const req = { body: { title: 'Hello', isAdmin: true } };
    const next = jest.fn();

    validate(schema)(req, {}, next);

    expect(req.body).toEqual({ title: 'Hello' });
    expect(next).toHaveBeenCalledWith();
  });

  it('passes a 400 error with field details when invalid', () => {
    const next = jest.fn();
    validate(schema)({ body: {} }, {}, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.details[0].field).toBe('title');
  });
});

describe('errorHandler middleware', () => {
  it('uses the status code and message from ApiError', () => {
    const res = mockResponse();
    errorHandler(new ApiError(404, 'Post not found'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'Post not found' } });
  });

  it('converts a Mongoose CastError into a 400', () => {
    const res = mockResponse();
    const castError = new mongoose.Error.CastError('ObjectId', 'abc', '_id');
    errorHandler(castError, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('converts a duplicate key error into a 409', () => {
    const res = mockResponse();
    errorHandler({ code: 11000, keyValue: { email: 'a@b.com' } }, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].error.message).toBe('email already exists');
  });
});
