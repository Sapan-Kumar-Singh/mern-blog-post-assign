import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors([]);
    setSubmitting(true);
    try {
      await register(form);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(err.response?.data?.error?.details || []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-box card">
      <h1>Create an account</h1>
      {error && <p className="error">{error}</p>}
      {fieldErrors.length > 0 && (
        <ul className="error small">
          {fieldErrors.map((d) => (
            <li key={d.field}>{d.message}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          required
        />
        <p className="muted small">At least 8 characters, including a letter and a number.</p>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="muted small">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
