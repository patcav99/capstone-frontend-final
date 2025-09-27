import React, { useState } from 'react';

function LoginModal({ subscriptionName, onSeleniumLogin, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSeleniumLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    await onSeleniumLogin(email, password);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSeleniumLogin} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 300 }}>
        <h2>Sign In to {subscriptionName}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 8 }}>Login</button>
        <button type="button" onClick={onClose} style={{ width: '100%', marginTop: 8, padding: 8 }}>Cancel</button>
      </form>
    </div>
  );
}

export default LoginModal;
