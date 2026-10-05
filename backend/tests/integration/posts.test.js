const request = require('supertest');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const { createUser, createAdmin, createPost, auth } = require('../helpers');

const postPayload = { title: 'My First Post!', content: 'Hello world, this is my first post.' };

describe('Posts API', () => {
  describe('POST /api/v1/posts', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/posts').send(postPayload);
      expect(res.status).toBe(401);
    });

    it('validates the payload', async () => {
      const { token } = await createUser();
      const res = await request(app).post('/api/v1/posts').set(auth(token)).send({ title: 'Hi' });

      expect(res.status).toBe(400);
      expect(res.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['title', 'content']));
    });

    it('creates a post with a slug and the logged-in user as author', async () => {
      const { user, token } = await createUser();
      const res = await request(app).post('/api/v1/posts').set(auth(token)).send(postPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe('my-first-post');
      expect(res.body.data.author._id).toBe(user._id.toString());
      expect(res.body.data.createdAt).toBeDefined();
    });

    it('generates a unique slug for duplicate titles', async () => {
      const { token } = await createUser();
      await request(app).post('/api/v1/posts').set(auth(token)).send(postPayload);
      const res = await request(app).post('/api/v1/posts').set(auth(token)).send(postPayload);

      expect(res.body.data.slug).toBe('my-first-post-1');
    });
  });

  describe('GET /api/v1/posts', () => {
    it('returns paginated posts without soft-deleted ones', async () => {
      const { user } = await createUser();
      await Promise.all([1, 2, 3].map((n) => createPost(user._id, { title: `Post ${n}` })));
      await createPost(user._id, { isDeleted: true, deletedAt: new Date() });

      const res = await request(app).get('/api/v1/posts?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
      expect(res.body.data[0].author.name).toBe('Test User');
    });

    it('filters posts by author', async () => {
      const { user: alice } = await createUser();
      const { user: bob } = await createUser();
      await createPost(alice._id);
      await createPost(bob._id);

      const res = await request(app).get(`/api/v1/posts?author=${alice._id}`);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].author._id).toBe(alice._id.toString());
    });

    it('rejects an invalid limit', async () => {
      const res = await request(app).get('/api/v1/posts?limit=500');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/posts/:slug', () => {
    it('returns a post by slug with its comment count', async () => {
      const { user } = await createUser();
      const post = await createPost(user._id, { slug: 'hello-world' });

      const res = await request(app).get('/api/v1/posts/hello-world');
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(post._id.toString());
      expect(res.body.data.commentCount).toBe(0);
    });

    it('returns 404 for an unknown slug', async () => {
      const res = await request(app).get('/api/v1/posts/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/posts/:id', () => {
    it('lets the author update their post and regenerates the slug', async () => {
      const { user, token } = await createUser();
      const post = await createPost(user._id);

      const res = await request(app)
        .patch(`/api/v1/posts/${post._id}`)
        .set(auth(token))
        .send({ title: 'Updated title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated title');
      expect(res.body.data.slug).toBe('updated-title');
    });

    it("forbids editing another user's post", async () => {
      const { user: owner } = await createUser();
      const { token: otherToken } = await createUser();
      const post = await createPost(owner._id);

      const res = await request(app)
        .patch(`/api/v1/posts/${post._id}`)
        .set(auth(otherToken))
        .send({ title: 'Hacked title' });

      expect(res.status).toBe(403);
    });

    it("allows an admin to edit any user's post", async () => {
      const { user: owner } = await createUser();
      const { token: adminToken } = await createAdmin();
      const post = await createPost(owner._id);

      const res = await request(app)
        .patch(`/api/v1/posts/${post._id}`)
        .set(auth(adminToken))
        .send({ content: 'Content updated by admin.' });

      expect(res.status).toBe(200);
    });

    it('returns 400 for an invalid id', async () => {
      const { token } = await createUser();
      const res = await request(app).patch('/api/v1/posts/123').set(auth(token)).send({ title: 'Valid title' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('soft deletes the post', async () => {
      const { user, token } = await createUser();
      const post = await createPost(user._id, { slug: 'to-delete' });

      const res = await request(app).delete(`/api/v1/posts/${post._id}`).set(auth(token));
      expect(res.status).toBe(200);

      const inDb = await Post.findById(post._id);
      expect(inDb.isDeleted).toBe(true);
      expect(inDb.deletedAt).toBeInstanceOf(Date);

      const getRes = await request(app).get('/api/v1/posts/to-delete');
      expect(getRes.status).toBe(404);
    });

    it("forbids deleting another user's post", async () => {
      const { user: owner } = await createUser();
      const { token: otherToken } = await createUser();
      const post = await createPost(owner._id);

      const res = await request(app).delete(`/api/v1/posts/${post._id}`).set(auth(otherToken));
      expect(res.status).toBe(403);
    });
  });
});
