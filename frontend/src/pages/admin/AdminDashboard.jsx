import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { formatDateTime } from '../../utils/format';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/activity')])
      .then(([statsRes, activityRes]) => {
        setStats(statsRes.data.data);
        setActivity(activityRes.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">Loading...</p>;

  return (
    <>
      <h1>Dashboard</h1>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-value">{stats.totalUsers}</span>
          <span className="muted">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalPosts}</span>
          <span className="muted">Total Posts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalComments}</span>
          <span className="muted">Total Comments</span>
        </div>
      </div>

      <h2>Recent Activity</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Target</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((log) => (
              <tr key={log._id}>
                <td>{log.user?.name || 'Deleted user'}</td>
                <td>
                  <span className="badge">{log.action}</span>
                </td>
                <td className="small">{log.target || log.path}</td>
                <td className="small">{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
            {!activity.length && (
              <tr>
                <td colSpan={4} className="muted">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
