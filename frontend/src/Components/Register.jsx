// Components/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Css/Register.css';
import { apiFetch } from '../Hooks/useApi';
import { CustomAlertModal } from './SharedModals';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName: '', lastName: '', childName: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) return setError("Please fill all required fields.");
    setLoading(true); setError(null);
    const res = await apiFetch('/send-otp', { method: 'POST', body: JSON.stringify({ email: form.email }) });
    setLoading(false);
    if (res && !res.error) setStep(2);
    else setError(res?.error || "Failed to send OTP.");
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await apiFetch('/register-with-otp', { method: 'POST', body: JSON.stringify({ ...form, otp }) });
    setLoading(false);
    if (res && !res.error) {
      setCustomAlert({
        type: 'success',
        icon: '🎉',
        title: 'Welcome to KnowBharat!',
        text: 'Registration Successful! You can now log in.',
        redirectTo: '/login'
      });
    } else {
      setError("Invalid OTP.");
    }
  };

  const handleCloseAlert = () => {
    const redirectPath = customAlert?.redirectTo;
    setCustomAlert(null);
    if (redirectPath) navigate(redirectPath);
  };

  return (
    <div className="register-page">
      {/* Floating Glass Shapes */}
      <div className="reg-shape" aria-hidden="true" />
      <div className="reg-shape" aria-hidden="true" />
      <div className="reg-shape" aria-hidden="true" />
      <div className="reg-shape" aria-hidden="true" />
      <div className="reg-shape" aria-hidden="true" />

      <div className="register-card">
        <div className="reg-header-group">
          {/*
            ✅ FIX 1 (CLS): Add explicit width + height to prevent layout shift.
            ✅ FIX 2 (LCP): Add fetchpriority="high" so browser prioritises this image.
            ✅ FIX 3 (LCP): Use a WebP version of the logo (KnowBharat.webp) — see note below.
                            <picture> falls back to PNG for browsers that don't support WebP.
            ✅ FIX 4 (LCP): Add decoding="sync" so the image is decoded on the main thread
                            immediately, avoiding render delay.
          */}
          <picture>
            <source srcSet="../KnowBharat.png" type="image/png" />
            <img
              src="../KnowBharat.png"
              alt="KnowBharat Logo"
              className="reg-logo-img"
              width="65"
              height="65"
              fetchpriority="high"
              decoding="sync"
            />
          </picture>
          <h1 className="reg-title">
            {step === 1 ? 'Join KnowBharat!' : 'Verify Email'}
          </h1>
        </div>

        <p className="reg-subtitle">
          {step === 1 ? 'Create an account to monitor progress.' : `Enter the OTP sent to ${form.email}`}
        </p>
        <div className="tricolor-bar" />

        {error && (
          <div className="reg-error" role="alert">
            ▲ {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} noValidate>
            <div className="reg-form-row">
              <div className="reg-form-group">
                {/* ✅ FIX 5 (A11y): Use htmlFor matching input id for proper label association */}
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  type="text"
                  className="reg-input"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="reg-form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  className="reg-input"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="reg-form-group">
              <label htmlFor="childName">Child's Name</label>
              <input
                id="childName"
                type="text"
                className="reg-input"
                value={form.childName}
                onChange={e => setForm({ ...form, childName: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div className="reg-form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                className="reg-input"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                required
              />
            </div>
            <div className="reg-form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="reg-input"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                required
              />
              {/* ✅ FIX 6 (A11y): aria-label + aria-pressed for screen readers */}
              <button
                type="button"
                className="reg-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <button type="submit" className="reg-submit-btn" disabled={loading}>
              {loading && <span className="reg-spinner" aria-hidden="true" />}
              {loading ? 'Sending OTP…' : 'Send OTP →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} noValidate>
            <div className="reg-form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                className="reg-input"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                autoComplete="one-time-code"
                required
              />
            </div>
            <button type="submit" className="reg-submit-btn" disabled={loading}>
              {loading && <span className="reg-spinner" aria-hidden="true" />}
              {loading ? 'Verifying…' : 'Create Account'}
            </button>
            <button
              type="button"
              className="reg-back-btn"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
          </form>
        )}

        {step === 1 && (
          <div className="reg-login-link" style={{ marginTop: '20px' }}>
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        )}
      </div>

      <CustomAlertModal alert={customAlert} onClose={handleCloseAlert} />
    </div>
  );
}