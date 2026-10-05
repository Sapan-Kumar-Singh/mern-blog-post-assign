import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';

// Handles both /posts/new and /posts/:slug/edit
export default function PostEditor() {
  const { slug } = useParams();
  const isEdit = Boolean(slug);
  const navigate = useNavigate();

  const [postId, setPostId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/posts/${slug}`)
      .then(({ data }) => {
        setPostId(data.data._id);
        setForm({ title: data.data.title, content: data.data.content });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [slug, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors([]);
    setSubmitting(true);
    try {
      const { data } = isEdit ? await api.patch(`/posts/${postId}`, form) : await api.post('/posts', form);
      navigate(`/posts/${data.data.slug}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(err.response?.data?.error?.details || []);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <div className="card">
      <h1>{isEdit ? 'Edit Post' : 'New Post'}</h1>
      {error && <p className="error">{error}</p>}
      {fieldErrors.length > 0 && (
        <ul className="error small">
          {fieldErrors.map((d) => (
            <li key={d.field}>{d.message}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={150} required />

        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" value={form.content} onChange={handleChange} rows={14} required />

        <div className="actions">
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Post' : 'Publish'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
