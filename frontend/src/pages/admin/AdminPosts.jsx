import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');

  const loadPosts = () => {
    api
      .get('/admin/posts', { params: { page, limit: 10, status } })
      .then(({ data }) => {
        setPosts(data.data);
        setMeta(data.meta);
      })
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => {
    loadPosts();
  }, [page, status]);

  const runAction = async (request) => {
    setError('');
    try {
      await request;
      loadPosts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deletePost = (post) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    runAction(api.delete(`/posts/${post._id}`));
  };

  const restorePost = (post) => runAction(api.patch(`/admin/posts/${post._id}/restore`));

  return (
    <>
      <h1>Manage Posts</h1>

      <label htmlFor="status" className="inline-label">
        Show:{' '}
        <select
          id="status"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="all">All posts</option>
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
        </select>
      </label>

      {error && <p className="error">{error}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post._id}>
                <td>{post.isDeleted ? post.title : <Link to={`/posts/${post.slug}`}>{post.title}</Link>}</td>
                <td>{post.author?.name || 'Deleted user'}</td>
                <td>
                  <span className={`badge ${post.isDeleted ? 'badge-danger' : 'badge-success'}`}>
                    {post.isDeleted ? 'Deleted' : 'Active'}
                  </span>
                </td>
                <td className="small">{formatDate(post.createdAt)}</td>
                <td className="actions">
                  {post.isDeleted ? (
                    <button type="button" className="btn btn-small btn-outline" onClick={() => restorePost(post)}>
                      Restore
                    </button>
                  ) : (
                    <>
                      <Link to={`/posts/${post.slug}/edit`} className="btn btn-small btn-outline">
                        Edit
                      </Link>
                      <button type="button" className="btn btn-small btn-danger" onClick={() => deletePost(post)}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!posts.length && (
              <tr>
                <td colSpan={5} className="muted">
                  No posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={setPage} />
    </>
  );
}
