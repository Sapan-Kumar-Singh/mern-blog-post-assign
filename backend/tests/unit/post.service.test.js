const mongoose = require('mongoose');
const postService = require('../../src/services/post.service');
const { isOwnerOrAdmin } = require('../../src/utils/permissions');
const { createUser, createPost } = require('../helpers');

describe('post.service.generateUniqueSlug', () => {
  it('creates a URL-friendly slug', async () => {
    const slug = await postService.generateUniqueSlug('  Hello, World! React & Node  ');
    expect(slug).toBe('hello-world-react-and-node');
  });

  it('adds a counter when the slug is already taken', async () => {
    const { user } = await createUser();
    await createPost(user._id, { slug: 'hello-world' });
    await createPost(user._id, { slug: 'hello-world-1' });

    expect(await postService.generateUniqueSlug('Hello World')).toBe('hello-world-2');
  });

  it('ignores the post being updated', async () => {
    const { user } = await createUser();
    const post = await createPost(user._id, { slug: 'hello-world' });

    expect(await postService.generateUniqueSlug('Hello World', post._id)).toBe('hello-world');
  });
});

describe('permissions.isOwnerOrAdmin', () => {
  const ownerId = new mongoose.Types.ObjectId();

  it('allows the owner', () => {
    expect(isOwnerOrAdmin({ _id: ownerId, role: 'user' }, ownerId)).toBe(true);
  });

  it('allows an admin', () => {
    expect(isOwnerOrAdmin({ _id: new mongoose.Types.ObjectId(), role: 'admin' }, ownerId)).toBe(true);
  });

  it('denies other users', () => {
    expect(isOwnerOrAdmin({ _id: new mongoose.Types.ObjectId(), role: 'user' }, ownerId)).toBe(false);
  });
});
