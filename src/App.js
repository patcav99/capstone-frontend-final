import "./App.css";
import SubscriptionList from "./SubscriptionList";
import React, { useEffect, useState } from "react";
export default App;

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSub, setNewSub] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const res = await fetch("http://patcav.shop/api/account/subscriptions/");
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

  if (loading) return <div className="App" style={{ marginTop: 40 }}>Loading subscriptions...</div>;
  if (error) return <div className="App" style={{ marginTop: 40 }}>Error: {error}</div>;

  return (
    <div className="App" style={{ marginTop: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={newSub}
          onChange={e => setNewSub(e.target.value)}
          placeholder="Add a subscription"
          style={{ marginRight: 8 }}
        />
        <button onClick={addSubscription} disabled={adding || !newSub.trim()}>
          {adding ? "Adding..." : "Add Subscription"}
        </button>
      </div>
  <SubscriptionList subscriptions={subscriptions} setSubscriptions={setSubscriptions} />
    </div>
  );
}

