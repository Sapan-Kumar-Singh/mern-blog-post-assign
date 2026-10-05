import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import Pagination from './Pagination';
import { formatDate } from '../utils/format';

const EXCERPT_LENGTH = 200;

// Used on the home page (all posts) and "My Posts" (filtered by author, with actions)
export default function PostList({ authorId, showActions = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = () => {
    setLoading(true);
    setError('');
    api
      .get('/posts', { params: { page, limit: 10, author: authorId } })
      .then(({ data }) => {
        setPosts(data.data);
        setMeta(data.meta);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, [page, authorId]);

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    try {
      await api.delete(`/posts/${post._id}`);
      loadPosts();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <p className="muted">Loading posts...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!posts.length) return <p className="muted">No posts yet.</p>;

  return (
    <>
      {posts.map((post) => (
        <article key={post._id} className="card">
          <h2>
            <Link to={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
          <p className="muted small">
            By {post.author?.name || 'Deleted user'} · {formatDate(post.createdAt)}
          </p>
          <p>
            {post.content.length > EXCERPT_LENGTH ? `${post.content.slice(0, EXCERPT_LENGTH)}...` : post.content}
          </p>

          {showActions && (
            <div className="actions">
              <Link to={`/posts/${post.slug}/edit`} className="btn btn-small btn-outline">
                Edit
              </Link>
              <button type="button" className="btn btn-small btn-danger" onClick={() => handleDelete(post)}>
                Delete
              </button>
            </div>
          )}
        </article>
      ))}

      <Pagination meta={meta} onPageChange={(newPage) => setSearchParams({ page: newPage })} />
    </>
  );
}
