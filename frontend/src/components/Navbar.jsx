import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          MERN Blog
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>

          {user ? (
            <>
              <NavLink to="/posts/new">New Post</NavLink>
              <NavLink to="/my-posts">My Posts</NavLink>
              {isAdmin && <NavLink to="/admin">Admin</NavLink>}
              <span className="nav-user">Hi, {user.name}</span>
              <button type="button" className="btn btn-small btn-outline" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
