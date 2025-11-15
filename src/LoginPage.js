import React, { useState } from 'react';

export default function LoginPage({ onLogin, onUsernameChange, username }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // username state is now managed by App.js
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
        setError((data && data.message) || JSON.stringify(data) || 'Login/Register failed');
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

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20, border: '1px solid #eee', borderRadius: 6 }}>
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
          </>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Username</label>
          <input type="text" value={username} onChange={e => onUsernameChange(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
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
    </div>
  );
}
