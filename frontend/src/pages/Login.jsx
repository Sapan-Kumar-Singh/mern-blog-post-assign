import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL, getErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(searchParams.get('error') === 'oauth' ? 'Social login failed. Please try again.' : '');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-box card">
      <h1>Login</h1>
      {location.state?.registered && !error && (
        <p className="success">Account created successfully. Please log in.</p>
      )}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="divider">or</div>

      {/* Full page redirect - the OAuth flow happens on the backend */}
      <a href={`${API_URL}/auth/google`} className="btn btn-block btn-google">
        Continue with Google
      </a>
      <a href={`${API_URL}/auth/facebook`} className="btn btn-block btn-facebook">
        Continue with Facebook
      </a>

      <p className="muted small">
        Don&apos;t have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
