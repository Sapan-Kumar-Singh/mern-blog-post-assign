const mongoose = require('mongoose');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const tokenService = require('../src/services/token.service');

const createUser = async (overrides = {}) => {
  const user = await User.create({
    name: 'Test User',
    email: `user-${new mongoose.Types.ObjectId()}@test.com`,
    password: 'Password123',
    ...overrides,
  });
  return { user, token: tokenService.generateAccessToken(user) };
};

const createAdmin = (overrides = {}) => createUser({ name: 'Admin User', role: 'admin', ...overrides });

const createPost = (authorId, overrides = {}) =>
  Post.create({
    title: 'Sample post',
    slug: `sample-post-${new mongoose.Types.ObjectId()}`,
    content: 'This is some sample post content.',
    author: authorId,
    ...overrides,
  });

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Returns just "refreshToken=<value>" from the Set-Cookie header
const getRefreshCookie = (res) =>
  (res.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='))?.split(';')[0];

module.exports = { createUser, createAdmin, createPost, auth, getRefreshCookie };
