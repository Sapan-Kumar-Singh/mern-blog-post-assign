const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const Comment = require('../../src/models/Comment');
const { createUser, createAdmin, createPost, auth } = require('../helpers');

describe('Admin API', () => {
  it('blocks regular users with 403', async () => {
    const { token } = await createUser();

    const statsRes = await request(app).get('/api/v1/admin/stats').set(auth(token));
    const usersRes = await request(app).get('/api/v1/admin/users').set(auth(token));

    expect(statsRes.status).toBe(403);
    expect(usersRes.status).toBe(403);
  });

  it('blocks unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/admin/stats');
    expect(res.status).toBe(401);
  });

  it('returns dashboard totals', async () => {
    const { token } = await createAdmin();
    const { user } = await createUser();
    const post = await createPost(user._id);
    await createPost(user._id, { isDeleted: true });
    await Comment.create({ content: 'Hi', post: post._id, author: user._id });

    const res = await request(app).get('/api/v1/admin/stats').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ totalUsers: 2, totalPosts: 1, totalComments: 1 });
  });

  it('lists users with search', async () => {
    const { token } = await createAdmin();
    await createUser({ name: 'Alice Smith' });
    await createUser({ name: 'Bob Jones' });

    const res = await request(app).get('/api/v1/admin/users?search=alice').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Alice Smith');
  });

  it("updates a user's role", async () => {
    const { token } = await createAdmin();
    const { user } = await createUser();

    const res = await request(app).patch(`/api/v1/admin/users/${user._id}`).set(auth(token)).send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });

  it('prevents an admin from changing their own role', async () => {
    const { user, token } = await createAdmin();

    const res = await request(app).patch(`/api/v1/admin/users/${user._id}`).set(auth(token)).send({ role: 'user' });

    expect(res.status).toBe(400);
  });

  it('immediately blocks a deactivated user', async () => {
    const { token: adminToken } = await createAdmin();
    const { user, token: userToken } = await createUser();

    await request(app).patch(`/api/v1/admin/users/${user._id}`).set(auth(adminToken)).send({ isActive: false });
    const res = await request(app).get('/api/v1/auth/me').set(auth(userToken));

    expect(res.status).toBe(401);
  });

  it('deletes a user and soft deletes their posts', async () => {
    const { token } = await createAdmin();
    const { user } = await createUser();
    const post = await createPost(user._id);

    const res = await request(app).delete(`/api/v1/admin/users/${user._id}`).set(auth(token));

    expect(res.status).toBe(200);
    expect(await User.findById(user._id)).toBeNull();
    expect((await Post.findById(post._id)).isDeleted).toBe(true);
  });

  it('lists deleted posts and restores one', async () => {
    const { token } = await createAdmin();
    const { user } = await createUser();
    await createPost(user._id);
    const deleted = await createPost(user._id, { isDeleted: true, deletedAt: new Date() });

    const listRes = await request(app).get('/api/v1/admin/posts?status=deleted').set(auth(token));
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0]._id).toBe(deleted._id.toString());

    const restoreRes = await request(app).patch(`/api/v1/admin/posts/${deleted._id}/restore`).set(auth(token));
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isDeleted).toBe(false);
  });
});
