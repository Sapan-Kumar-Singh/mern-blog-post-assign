import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import { formatDate } from '../utils/format';

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(`/posts/${slug}`)
      .then(({ data }) => setPost(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <p className="muted">Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!post) return null;

  const canManage = isAdmin || post.author?._id === user?._id;
  const wasEdited = post.updatedAt !== post.createdAt;

  return (
    <>
      <article className="card">
        <h1>{post.title}</h1>
        <p className="muted small">
          By {post.author?.name || 'Deleted user'} · {formatDate(post.createdAt)}
          {wasEdited && ` · Updated ${formatDate(post.updatedAt)}`}
        </p>

        {canManage && (
          <div className="actions">
            <Link to={`/posts/${post.slug}/edit`} className="btn btn-small btn-outline">
              Edit
            </Link>
            <button type="button" className="btn btn-small btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}

        <div className="post-content pre-wrap">{post.content}</div>
      </article>

      <CommentSection postId={post._id} />
    </>
  );
}
