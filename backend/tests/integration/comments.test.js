const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Comment = require('../../src/models/Comment');
const { createUser, createAdmin, createPost, auth } = require('../helpers');

describe('Comments API', () => {
  let author;
  let post;

  beforeEach(async () => {
    ({ user: author } = await createUser());
    post = await createPost(author._id);
  });

  it('lets a logged-in user comment on a post', async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .post(`/api/v1/posts/${post._id}/comments`)
      .set(auth(token))
      .send({ content: 'Nice post!' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Nice post!');
    expect(res.body.data.author._id).toBe(user._id.toString());
    expect(res.body.data.post).toBe(post._id.toString());
  });

  it('returns 404 when commenting on a missing or deleted post', async () => {
    const { token } = await createUser();
    const deleted = await createPost(author._id, { isDeleted: true });

    const missingRes = await request(app)
      .post(`/api/v1/posts/${new mongoose.Types.ObjectId()}/comments`)
      .set(auth(token))
      .send({ content: 'Hello' });
    const deletedRes = await request(app)
      .post(`/api/v1/posts/${deleted._id}/comments`)
      .set(auth(token))
      .send({ content: 'Hello' });

    expect(missingRes.status).toBe(404);
    expect(deletedRes.status).toBe(404);
  });

  it('lists comments for a post with pagination', async () => {
    await Comment.create([
      { content: 'First', post: post._id, author: author._id },
      { content: 'Second', post: post._id, author: author._id },
    ]);

    const res = await request(app).get(`/api/v1/posts/${post._id}/comments?limit=1`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data[0].author.name).toBeDefined();
  });

  it('lets the owner edit their comment', async () => {
    const { user, token } = await createUser();
    const comment = await Comment.create({ content: 'Old', post: post._id, author: user._id });

    const res = await request(app).patch(`/api/v1/comments/${comment._id}`).set(auth(token)).send({ content: 'New' });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('New');
  });

  it("forbids editing or deleting someone else's comment", async () => {
    const { user: owner } = await createUser();
    const { token: otherToken } = await createUser();
    const comment = await Comment.create({ content: 'Mine', post: post._id, author: owner._id });

    const editRes = await request(app)
      .patch(`/api/v1/comments/${comment._id}`)
      .set(auth(otherToken))
      .send({ content: 'Not yours' });
    const deleteRes = await request(app).delete(`/api/v1/comments/${comment._id}`).set(auth(otherToken));

    expect(editRes.status).toBe(403);
    expect(deleteRes.status).toBe(403);
  });

  it("allows an admin to delete any comment", async () => {
    const { user: owner } = await createUser();
    const { token: adminToken } = await createAdmin();
    const comment = await Comment.create({ content: 'Spam', post: post._id, author: owner._id });

    const res = await request(app).delete(`/api/v1/comments/${comment._id}`).set(auth(adminToken));

    expect(res.status).toBe(200);
    expect(await Comment.findById(comment._id)).toBeNull();
  });
});
