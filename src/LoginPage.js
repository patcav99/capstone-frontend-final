import React, { useState } from 'react';

export default function LoginPage({ onLogin, onUsernameChange, username }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/account/login/' : '/api/account/register/';
      let payload;
      if (mode === 'login') {
        payload = { username, password };
      } else {
        payload = {
          first_name: firstName,
          last_name: lastName,
          username,
          email,
          password
        };
      }
      console.log('DEBUG: Username value before login request:', username);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  const data = await res.json();
  console.log('Login/Register response:', data); // Debug log
  console.log('DEBUG: Username value after login response:', username);
      if (!res.ok) {
        // Try to show specific backend error messages for registration
        if (mode === 'register' && data && data.data) {
          // If serializer errors are present, display them, including non_field_errors
          let errorMessages = '';
          if (data.data.non_field_errors) {
            errorMessages += data.data.non_field_errors.join(' ') + ' ';
          }
          errorMessages += Object.entries(data.data)
            .filter(([key]) => key !== 'non_field_errors')
            .map(([_, val]) => Array.isArray(val) ? val.join(' ') : val)
            .join(' ');
          setError(errorMessages.trim() || data.message || 'Registration failed');
        } else {
          setError((data && data.message) || JSON.stringify(data) || 'Login/Register failed');
        }
        setSuccess(null);
      } else {
        // If backend returns a token, save and notify parent
        const token = data.access || (data.data && data.data.token && data.data.token.access) || data.token || data.access_token;
        if (token) {
          localStorage.setItem('token', token);
          setSuccess('Login successful!');
          setError(null);
          console.log('DEBUG: Username passed to onLogin:', username);
          if (typeof onLogin === 'function') onLogin(token, username);
        } else {
          setError('Login/Register succeeded but no access token returned. Please check backend response format.');
          setSuccess(null);
        }
      }
    } catch (err) {
      setError('Network error');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotStatus(null);
    setError(null);
    try {
      setLoading(true);
      const res = await fetch('/api/account/request-password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotStatus('If your email is registered, you will receive a password reset link.');
        setShowForgotModal(false);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20, border: '1px solid #eee', borderRadius: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#007bff', flex: '0 0 auto' }}>RateMate!</h1>
      </div>
      <h2 style={{ marginTop: 0 }}>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
  {error && <div style={{ background: '#fdecea', color: '#611a15', padding: 8, borderRadius: 4, marginBottom: 12 }}>{error}</div>}
  {success && <div style={{ background: '#e6ffed', color: '#1a611a', padding: 8, borderRadius: 4, marginBottom: 12 }}>{success}</div>}
  <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </div>
          </>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Username</label>
          <input type="text" value={username} onChange={e => onUsernameChange(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
          {mode === 'login' && (
            <button
              type="button"
              style={{ marginTop: 8, background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
              onClick={() => setShowForgotModal(true)}
            >
              Forgot Password?
            </button>
          )}
        </div>
        {mode === 'register' && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>{loading ? 'Working...' : (mode === 'login' ? 'Sign In' : 'Create Account')}</button>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ padding: '8px 16px' }}>{mode === 'login' ? 'Switch to Register' : 'Switch to Login'}</button>
        </div>
      </form>
      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#218c4a', color: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', minWidth: 320 }}>
            <h3>Reset Password</h3>
            <form onSubmit={handleForgotSubmit}>
              <label style={{ display: 'block', marginBottom: 8 }}>Enter your email address:</label>
              <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required style={{ width: '100%', padding: 8, marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ padding: '8px 16px' }}>Send Reset Link</button>
                <button type="button" style={{ padding: '8px 16px' }} onClick={() => setShowForgotModal(false)}>Cancel</button>
              </div>
            </form>
            {forgotStatus && <div style={{ marginTop: 12, color: '#007bff' }}>{forgotStatus}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
