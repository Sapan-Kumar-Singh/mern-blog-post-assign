import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// The backend redirects here after Google/Facebook login. AuthContext has already
// used the refresh cookie to load the user, so we only need to wait for it.
export default function OAuthSuccess() {
  const { user, loading } = useAuth();

  if (loading) return <p className="muted">Signing you in...</p>;

  return user ? <Navigate to="/" replace /> : <Navigate to="/login?error=oauth" replace />;
}
