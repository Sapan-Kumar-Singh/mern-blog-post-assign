import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3>Admin Panel</h3>
        <NavLink to="/admin" end>
          Dashboard
        </NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/posts">Posts</NavLink>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
