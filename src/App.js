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
  const [accessToken, setAccessToken] = useState(localStorage.getItem('token') || null);
  const [showLogin, setShowLogin] = useState(!localStorage.getItem('token'));
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (accessToken && !showLogin) {
      fetchSubscriptions();
    }
    // eslint-disable-next-line
  }, [accessToken, showLogin]);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const res = await fetch("http://patcav.shop/api/account/my_subscriptions/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
        }
      });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
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
    return (
      <LoginPage 
        onLogin={(token, uname) => { 
          setAccessToken(token); 
          setUsername(uname);
          console.log('DEBUG: Username set in App.js:', uname);
          localStorage.setItem('token', token); 
          setShowLogin(false); 
          console.log("Login success, hiding login page");
        }}
        onUsernameChange={setUsername}
        username={username}
      />
    );
  }

  if (loading) return <div className="App" style={{ marginTop: 40 }}>Loading subscriptions...</div>;
  if (error) return <div className="App" style={{ marginTop: 40 }}>Error: {error}</div>;

  // Only render subscription components after login
  return (
    <div className="App" style={{ marginTop: 40 }}>
      <div style={{ marginBottom: 24 }}>
  <BankLink setSubscriptions={setSubscriptions} onRecurringFetched={() => subListRef.current?.fetchAndCheckAverages()} accessToken={accessToken} setAccessToken={setAccessToken} username={username} />
  {console.log('DEBUG: Username prop to BankLink:', username)}
      </div>
      <SubscriptionList ref={subListRef} subscriptions={subscriptions} setSubscriptions={setSubscriptions} accessToken={accessToken} />
      <div style={{ marginTop: 20 }}>
        <button onClick={() => { localStorage.removeItem('token'); setAccessToken(null); setShowLogin(true); setUsername(""); }}>Sign out</button>
      </div>
    </div>
  );
}

export default App;