import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';

const PAGE_SIZE = 10;

export default function CommentSection({ postId }) {
  const { user, isAdmin } = useAuth();

  const [comments, setComments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');

  const loadComments = (page) => {
    api
      .get(`/posts/${postId}/comments`, { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        setComments((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
        setMeta(data.meta);
      })
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => {
    loadComments(1);
  }, [postId]);

  const canManage = (comment) => isAdmin || comment.author?._id === user?._id;

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { content: newComment });
      setComments((prev) => [data.data, ...prev]);
      setMeta((prev) => prev && { ...prev, total: prev.total + 1 });
      setNewComment('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdate = async (commentId) => {
    try {
      const { data } = await api.patch(`/comments/${commentId}`, { content: editText });
      setComments((prev) => prev.map((c) => (c._id === commentId ? data.data : c)));
      setEditingId(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setMeta((prev) => prev && { ...prev, total: prev.total - 1 });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="comments">
      <h3>Comments ({meta?.total ?? 0})</h3>

      {user ? (
        <form onSubmit={handleAdd} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            maxLength={1000}
            required
          />
          <button type="submit" className="btn">
            Add Comment
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link to="/login">Login</Link> to join the discussion.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {comments.map((comment) => (
        <div key={comment._id} className="comment">
          <p className="muted small">
            <strong>{comment.author?.name || 'Deleted user'}</strong> · {formatDateTime(comment.createdAt)}
          </p>

          {editingId === comment._id ? (
            <>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} maxLength={1000} />
              <div className="actions">
                <button type="button" className="btn btn-small" onClick={() => handleUpdate(comment._id)}>
                  Save
                </button>
                <button type="button" className="btn btn-small btn-outline" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="pre-wrap">{comment.content}</p>
          )}

          {canManage(comment) && editingId !== comment._id && (
            <div className="actions">
              <button
                type="button"
                className="btn btn-small btn-outline"
                onClick={() => {
                  setEditingId(comment._id);
                  setEditText(comment.content);
                }}
              >
                Edit
              </button>
              <button type="button" className="btn btn-small btn-danger" onClick={() => handleDelete(comment._id)}>
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {meta && meta.page < meta.totalPages && (
        <button type="button" className="btn btn-outline" onClick={() => loadComments(meta.page + 1)}>
          Load more comments
        </button>
      )}
    </section>
  );
}
