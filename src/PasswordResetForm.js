import React, { useState } from 'react';

export default function PasswordResetForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  // Extract uid and token from URL query params
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/api/account/password-reset-confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Password has been reset successfully. You may now log in.');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20, border: '1px solid #eee', borderRadius: 6 }}>
      <h2>Reset Your Password</h2>
      {error && <div style={{ background: '#fdecea', color: '#611a15', padding: 8, borderRadius: 4, marginBottom: 12 }}>{error}</div>}
      {status && <div style={{ background: '#e6ffed', color: '#1a611a', padding: 8, borderRadius: 4, marginBottom: 12 }}>{status}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Reset Password</button>
      </form>
    </div>
  );
}
