// Components/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Css/Register.css';
import { apiFetch } from '../Hooks/useApi';
import { CustomAlertModal } from './SharedModals';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ childName: '', schoolName: '', dob: '', phone: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
  e.preventDefault();
  if (!form.childName || !form.schoolName || !form.dob || !form.phone || !form.email || !form.password) {
      return setError("Please fill all required fields.");
  }
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
          <picture>
            <source srcSet="../KnowBharat.webp" type="image/webp" />
            <img
              src="../KnowBharat.webp"
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
            <div className="reg-form-group">
              <label htmlFor="childName">Student's Full Name *</label>
              <input id="childName" type="text" className="reg-input" value={form.childName} onChange={e => setForm({ ...form, childName: e.target.value })} required />
            </div>
            
            <div className="reg-form-row">
              <div className="reg-form-group">
                <label htmlFor="schoolName">School Name *</label>
                <input id="schoolName" type="text" className="reg-input" value={form.schoolName} onChange={e => setForm({ ...form, schoolName: e.target.value })} required />
              </div>
              <div className="reg-form-group">
                <label htmlFor="dob">Date of Birth *</label>
                <input id="dob" type="date" className="reg-input" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} required />
              </div>
            </div>

            <div className="reg-form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input id="phone" type="tel" className="reg-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>

            <div className="reg-form-group">
              <label htmlFor="email">Email *</label>
              <input id="email" type="email" className="reg-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="reg-form-group">
              <label htmlFor="password">Password *</label>
              <input id="password" type={showPassword ? "text" : "password"} className="reg-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="reg-input-toggle" onClick={() => setShowPassword(!showPassword)}>
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