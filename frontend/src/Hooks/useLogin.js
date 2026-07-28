// Hooks/useLogin.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
const BASE = `${API_BASE_URL}/api/auth`;

function getDeviceInfo() {
  return `${navigator.userAgent.slice(0, 80)}`;
}

export default function useLogin() {
  const navigate = useNavigate();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  function validate() {
    if (!email.trim())    return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email.';
    if (!password)        return 'Password is required.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:      email.trim().toLowerCase(),
          password,
          role:       'parent',
          deviceInfo: getDeviceInfo(),     // ← device fingerprint
        }),
      });

      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json'))
        throw new Error('Cannot reach the server.');

      const data = await res.json();

      if (res.status === 409)
        throw new Error(data.message); // device limit hit

      if (!res.ok)
        throw new Error(data.message || 'Login failed.');

      localStorage.setItem('token',  data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('role',   'parent');

      navigate('/parent-dashboard');
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'Cannot connect to server. Is Spring Boot running on port 8081?'
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, showPassword, setShowPassword, error, loading, handleSubmit };
}