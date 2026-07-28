// Components/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Css/Login.css';
import { apiFetch } from '../Hooks/useApi';
import { CustomAlertModal } from './SharedModals'; // 🌟 IMPORT REUSABLE MODAL

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password State
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [otp, setOtp] = useState('');

  // 🌟 Custom Alert State
  const [customAlert, setCustomAlert] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setLoading(false);
    if (res && res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('userId', res.userId);
      navigate('/parent-dashboard');
    } else {
      setError(res?.error || "Invalid credentials.");
    }
  };

  const handleForgotPass = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await apiFetch('/forgot-password-otp', { method: 'POST', body: JSON.stringify({ email }) });
    setLoading(false);
    if (res && !res.error) {
      setMode('reset');
      setError(null);
    } else {
      setError("Email not found.");
    }
  };

  const handleResetPass = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await apiFetch('/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword: password }) });
    setLoading(false);

    if (res && !res.error) {
      // 🌟 Trigger the beautiful SweetAlert instead of native alert()
      setCustomAlert({
        type: 'success',
        icon: '✅',
        title: 'Password Reset Successful!',
        text: 'Your password has been successfully updated. You can now log in.',
        onCloseAction: () => {
          setMode('login');
          setPassword('');
          setOtp('');
        }
      });
    } else {
      setError(res?.error || "Invalid OTP.");
    }
  };

  // 🌟 Handler to close alert and execute specific actions (like switching to login view)
  const handleCloseAlert = () => {
    const action = customAlert?.onCloseAction;
    setCustomAlert(null);
    if (action) {
      action();
    }
  };

  return (
    <div className="login-page">
      {/* 🌟 Premium Floating Glass Shapes */}
      <div className="lp-shape" />
      <div className="lp-shape" />
      <div className="lp-shape" />
      <div className="lp-shape" />
      <div className="lp-shape" />

      <div className="login-card">
        <div className="lp-badge">Parent Portal</div>

        {/* 🌟 Flex container for Logo and Title side-by-side */}
        <div className="lp-header-group">
          <img
            src="/KnowBharat.webp"
            alt="KnowBharat Logo"
            className="lp-logo-img"
            width="65"
            height="65"
          />
          <h1 className="lp-title">KnowBharat</h1>
        </div>

        <p className="lp-subtitle">{mode === 'login' ? 'Monitor your child’s learning' : 'Reset your password'}</p>
        <div className="tricolor-bar" />

        {error && <div className="lp-error">▲ {error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="lp-form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="lp-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="lp-form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="lp-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="lp-input-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="lp-forgot">
              <button type="button" style={{ background: 'none', border: 'none', color: '#004E89', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }} onClick={() => { setMode('forgot'); setError(null); }}>
                Forgot password?
              </button>
            </div>
            <button type="submit" className="lp-submit-btn" disabled={loading}>
              {loading && <span className="lp-spinner"></span>}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPass}>
            <div className="lp-form-group">
              <label htmlFor="forgot-email">Enter your registered Email</label>
              <input id="forgot-email" type="email" className="lp-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="lp-submit-btn" disabled={loading}>
              {loading && <span className="lp-spinner"></span>}
              {loading ? 'Sending...' : 'Send Reset OTP'}
            </button>
            <button type="button" style={{ background: 'none', border: 'none', color: '#004E89', marginTop: '15px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }} onClick={() => { setMode('login'); setError(null); }}>
              ← Back to Login
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPass}>
            <div className="lp-form-group">
              <label htmlFor="reset-otp">Enter OTP from Email</label>
              <input id="reset-otp" type="text" className="lp-input" value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>
            <div className="lp-form-group">
              <label htmlFor="reset-password">New Password</label>
              <input id="reset-password" type={showPassword ? "text" : "password"} className="lp-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="lp-submit-btn" disabled={loading}>
              {loading && <span className="lp-spinner"></span>}
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <div className="lp-register-link" style={{ marginTop: '20px' }}>
            New parent? <Link to="/register">Create an account</Link>
          </div>
        )}
      </div>

      {/* 🌟 Custom SweetAlert Component */}
      <CustomAlertModal alert={customAlert} onClose={handleCloseAlert} />
    </div>
  );
}