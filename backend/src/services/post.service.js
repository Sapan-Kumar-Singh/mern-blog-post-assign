const slugify = require('slugify');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { assertOwnerOrAdmin } = require('../utils/permissions');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const AUTHOR_FIELDS = 'name avatar';

const generateUniqueSlug = async (title, excludePostId) => {
  const baseSlug = slugify(title, { lower: true, strict: true }) || 'post';
  let slug = baseSlug;
  let counter = 1;

  const filter = () => (excludePostId ? { slug, _id: { $ne: excludePostId } } : { slug });

  // Soft-deleted posts keep their slug, so they're included in this check
  // eslint-disable-next-line no-await-in-loop
  while (await Post.exists(filter())) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

const findActivePostOrFail = async (postId) => {
  const post = await Post.findOne({ _id: postId, isDeleted: false });
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }
  return post;
};

const listPosts = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { isDeleted: false };
  if (query.author) filter.author = query.author;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title slug content author createdAt updatedAt')
      .populate('author', AUTHOR_FIELDS)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return { posts, meta: buildPaginationMeta(page, limit, total) };
};

const getPostBySlug = async (slug) => {
  const post = await Post.findOne({ slug, isDeleted: false })
    .populate('author', AUTHOR_FIELDS)
    .populate('commentCount');

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }
  return post;
};

const createPost = async (authorId, { title, content }) => {
  const slug = await generateUniqueSlug(title);
  const post = await Post.create({ title, content, slug, author: authorId });
  return post.populate('author', AUTHOR_FIELDS);
};

const updatePost = async (postId, user, updates) => {
  const post = await findActivePostOrFail(postId);
  assertOwnerOrAdmin(user, post.author, 'You can only edit your own posts');

  if (updates.title && updates.title !== post.title) {
    post.slug = await generateUniqueSlug(updates.title, post._id);
  }
  Object.assign(post, updates);
  await post.save();

  return post.populate('author', AUTHOR_FIELDS);
};

const deletePost = async (postId, user) => {
  const post = await findActivePostOrFail(postId);
  assertOwnerOrAdmin(user, post.author, 'You can only delete your own posts');

  post.isDeleted = true;
  post.deletedAt = new Date();
  await post.save();
  return post;
};

// ----- Admin -----

const listAllPosts = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.status === 'active') filter.isDeleted = false;
  if (query.status === 'deleted') filter.isDeleted = true;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title slug author isDeleted deletedAt createdAt')
      .populate('author', 'name email')
      .lean(),
    Post.countDocuments(filter),
  ]);

  return { posts, meta: buildPaginationMeta(page, limit, total) };
};

const restorePost = async (postId) => {
  const post = await Post.findOneAndUpdate(
    { _id: postId, isDeleted: true },
    { isDeleted: false, deletedAt: null },
    { new: true }
  );
  if (!post) {
    throw new ApiError(404, 'Deleted post not found');
  }
  return post;
};

module.exports = {
  generateUniqueSlug,
  findActivePostOrFail,
  listPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  listAllPosts,
  restorePost,
};
