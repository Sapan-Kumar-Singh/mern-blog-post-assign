import { createContext, useContext, useEffect, useState } from 'react';
import api, { refreshAccessToken, setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on page load using the refresh token cookie.
  // This also completes Google/Facebook logins (the backend sets the cookie before redirecting).
  useEffect(() => {
    refreshAccessToken()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const handleForcedLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const handleAuthSuccess = ({ data }) => {
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const login = (credentials) => api.post('/auth/login', credentials).then(handleAuthSuccess);

  // Registration doesn't log the user in; they're sent to the login page afterwards
  const register = (details) => api.post('/auth/register', details).then(({ data }) => data.data);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
