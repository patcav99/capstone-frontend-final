import React, { useState, useEffect, useRef } from "react";
import BankLink from "./BankLink";
import SubscriptionList from "./SubscriptionList";
import LoginPage from "./LoginPage";
function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSub, setNewSub] = useState("");
  const [adding, setAdding] = useState(false);
  const subListRef = useRef();
  // Helper to check if token is valid (non-empty string)
  function isTokenValid(token) {
    return typeof token === 'string' && token.trim().length > 0;
  }
  const initialToken = localStorage.getItem('token');
  const [jwtToken, setJwtToken] = useState(isTokenValid(initialToken) ? initialToken : null);
  // plaidToken should only be set from Plaid API response, never from JWT
  const [plaidToken, setPlaidToken] = useState(null);
  const [showLogin, setShowLogin] = useState(!isTokenValid(initialToken));
  // ...existing code...
    const [username, setUsername] = useState(() => window.localStorage.getItem('username') || "");
  useEffect(() => {
    // Only fetch subscriptions if logged in and token exists
    if (showLogin || !isTokenValid(jwtToken)) {
      // Do not fetch subscriptions before login or with invalid token
      return;
    }
    fetchSubscriptions();
    // eslint-disable-next-line
  }, [jwtToken, showLogin]);

  async function fetchSubscriptions() {
    // Prevent running if not logged in or with invalid token
    console.log('DEBUG: fetchSubscriptions called. jwtToken:', jwtToken, 'showLogin:', showLogin);
    if (!isTokenValid(jwtToken) || showLogin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://patcav.shop/api/account/my_subscriptions/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        }
      });
      if (res.status === 401) {
        // Token is invalid or expired, clear and show login
        localStorage.removeItem('token');
        setJwtToken(null);
        setShowLogin(true);
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch subscriptions: " + res.status);
      const data = await res.json();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addSubscription() {
    if (!newSub.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("http://patcav.shop/api/account/receive-list/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [newSub.trim()] })
      });
      if (!res.ok) throw new Error("Failed to add subscription");
      setNewSub("");
      await fetchSubscriptions();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (showLogin) {
    console.log('DEBUG: Rendering LoginPage (showLogin is true)');
    return (
      <LoginPage 
        onLogin={(token, uname) => { 
          setJwtToken(token); 
          setUsername(uname);
          console.log('DEBUG: Username set in App.js:', uname);
          localStorage.setItem('token', token); 
          setShowLogin(!isTokenValid(token)); 
          // DO NOT setPlaidToken here; plaidToken is only set from Plaid API response
          console.log("Login success, hiding login page");
        }}
        onUsernameChange={setUsername}
        username={username}
      />
    );
  }

  if (!showLogin && loading) return <div className="App" style={{ marginTop: 40 }}>Loading subscriptions...</div>;
  if (!showLogin && error) return <div className="App" style={{ marginTop: 40 }}>Error: {error}</div>;

  // Only render subscription components after login
  console.log('DEBUG: Username value in App.js before BankLink render:', username);
  return (
    <div className="App" style={{ marginTop: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <BankLink
          setSubscriptions={setSubscriptions}
          onRecurringFetched={() => subListRef.current?.fetchAndCheckAverages()}
          accessToken={plaidToken}
          setPlaidToken={setPlaidToken}
          username={username}
        />
        {console.log('DEBUG: Username prop to BankLink:', username)}
      </div>
      <SubscriptionList
        ref={subListRef}
        subscriptions={subscriptions}
        setSubscriptions={setSubscriptions}
        jwtToken={jwtToken}
        plaidToken={plaidToken}
      />
      <div style={{ marginTop: 20 }}>
        <button onClick={() => { localStorage.removeItem('token'); setJwtToken(null); setShowLogin(true); setUsername(""); }}>Sign out</button>
      </div>
    </div>
  );
}

export default App;