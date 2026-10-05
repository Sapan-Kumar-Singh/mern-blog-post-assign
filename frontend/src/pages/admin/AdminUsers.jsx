import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState('');

  const loadUsers = () => {
    api
      .get('/admin/users', { params: { page, limit: 10, search } })
      .then(({ data }) => {
        setUsers(data.data);
        setMeta(data.meta);
      })
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const updateUser = async (userId, updates) => {
    setError('');
    try {
      const { data } = await api.patch(`/admin/users/${userId}`, updates);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, ...data.data } : u)));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? Their posts will be removed as well.`)) return;
    setError('');
    try {
      await api.delete(`/admin/users/${user._id}`);
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <h1>Manage Users</h1>

      <form onSubmit={handleSearch} className="search-form">
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or email" />
        <button type="submit" className="btn btn-small">
          Search
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u._id === currentUser._id;
              return (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={isSelf}
                      onChange={(e) => updateUser(u._id, { role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="small">{formatDate(u.createdAt)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="btn btn-small btn-outline"
                      disabled={isSelf}
                      onClick={() => updateUser(u._id, { isActive: !u.isActive })}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className="btn btn-small btn-danger" disabled={isSelf} onClick={() => deleteUser(u)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={setPage} />
    </>
  );
}
