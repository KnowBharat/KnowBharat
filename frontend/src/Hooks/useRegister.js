// hooks/useRegister.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Password strength calculator ─────────────────────────────────────────────
export function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  return score;
}

export const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
export const STRENGTH_CLASSES = { 1: 'weak', 2: 'medium', 3: 'strong', 4: 'strong' };

// ── Main hook ────────────────────────────────────────────────────────────────
export default function useRegister() {
  const navigate = useNavigate();

  // Form fields
  const [form, setForm] = useState({
    firstName:       '',
    lastName:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
    childName:       '',
  });

  // UI state
  const [agreed,        setAgreed]        = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [loading,       setLoading]       = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  // Derived password strength
  const strength      = getStrength(form.password);
  const strengthLabel = STRENGTH_LABELS[strength] || '';
  const strengthClass = STRENGTH_CLASSES[strength] || '';

  // Field updater
  const update = (key, value) => {
    setError('');                              // clear error on any change
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // ── Client-side validation ────────────────────────────────────────────────
  function validate() {
    if (!form.firstName.trim())
      return 'First name is required.';
    if (!form.email.trim())
      return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Please enter a valid email address.';
    if (!form.password)
      return 'Password is required.';
    if (form.password.length < 8)
      return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword)
      return 'Passwords do not match.';
    if (!agreed)
      return 'Please accept the Terms & Conditions.';
    return null; // no error
  }

  // ── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8081/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim().toLowerCase(),
          password:  form.password,
          childName: form.childName.trim(),
          role:      'parent',
        }),
      });

      // Guard: backend might return HTML if server is down
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Cannot reach the server. Make sure Spring Boot is running on port 8081.'
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      setSuccess('🎉 Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2200);

    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to server. Is the backend running on port 8081?'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Expose everything the component needs ─────────────────────────────────
  return {
    // form values
    form,
    update,
    // checkboxes / toggles
    agreed,
    setAgreed,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    // derived
    strength,
    strengthLabel,
    strengthClass,
    // ui state
    error,
    success,
    loading,
    // submit
    handleSubmit,
  };
}