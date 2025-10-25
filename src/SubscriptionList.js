import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

function TotalPriceButton({ averages, subscriptions, show, total, onToggle }) {
  return (
    <div>
      <button
        style={{ padding: '8px 20px', background: show ? '#d32f2f' : '#388e3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
        onClick={onToggle}
        disabled={subscriptions.length === 0}
      >
        {show ? 'Hide Total' : 'Calculate Total Price Per Month'}
      </button>
      {show && (
        <div style={{ marginTop: 12, fontSize: 18, fontWeight: 600 }}>
          Total per month: ${total ? total.toFixed(2) : '0.00'}
        </div>
      )}
      {show && (
        <div style={{ marginTop: 16 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {subscriptions.map(sub => (
              <li key={sub.id} style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>{sub.name}:</span>
                <span style={{ marginLeft: 8 }}>
                  {averages[Number(sub.id)] !== undefined && averages[Number(sub.id)] !== null
                    ? `$${parseFloat(averages[Number(sub.id)]).toFixed(2)}`
                    : 'N/A'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const SubscriptionList = forwardRef(({ subscriptions, setSubscriptions, accessToken }, ref) => {
  const [openDropdown, setOpenDropdown] = useState({});
  const [detailsCache, setDetailsCache] = useState({});
  const [averages, setAverages] = useState({});
  const [prevAverages, setPrevAverages] = useState(() => {
    try {
      const stored = localStorage.getItem('prevAverages');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [showTotal, setShowTotal] = useState(false);
  const [total, setTotal] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState({}); // { subId: [transactions] }

  // Expose this function to parent via ref
  const fetchAndCheckAverages = () => {
    fetch('http://patcav.shop/api/account/subscription-averages/', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.subscriptions) {
          const avgMap = {};
          const newNotifications = [];
          data.subscriptions.forEach(sub => {
            avgMap[sub.id] = sub.average_amount;
            // Days until predicted next date
            if (sub.predicted_next_date) {
              const today = new Date();
              const nextDate = new Date(sub.predicted_next_date);
              const diffTime = nextDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (!isNaN(diffDays) && diffDays >= 0) {
                newNotifications.push(
                  `Subscription "${sub.name}" has ${diffDays} day(s) remaining until the next payment date (${sub.predicted_next_date})`
                );
              }
            }
          });
          // Always compare against the latest prevAverages in state
          Object.keys(avgMap).forEach(id => {
            if (
              prevAverages[id] !== undefined &&
              avgMap[id] !== undefined &&
              avgMap[id] !== prevAverages[id]
            ) {
              newNotifications.push(
                `Subscription "${data.subscriptions.find(s => s.id === Number(id))?.name || id}" changed its rate from $${prevAverages[id]} to $${avgMap[id]}`
              );
            } else if (
              prevAverages[id] === undefined && avgMap[id] !== undefined
            ) {
              newNotifications.push(
                `Subscription "${data.subscriptions.find(s => s.id === Number(id))?.name || id}" rate is $${avgMap[id]}`
              );
            }
          });
          setNotifications(newNotifications);
          setPrevAverages(avgMap);
          localStorage.setItem('prevAverages', JSON.stringify(avgMap));
          setAverages(avgMap);
        }
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ fetchAndCheckAverages }));

  // Initial fetch on mount, only if accessToken exists
  useEffect(() => {
    if (accessToken) {
      fetchAndCheckAverages();
    }
  }, [accessToken]);

  const handleToggleTotal = () => {
    if (showTotal) {
      setShowTotal(false);
    } else {
      let sum = 0;
      subscriptions.forEach(sub => {
        let amt = averages[sub.id];
        if (amt !== undefined && amt !== null) {
          let num = typeof amt === 'number' ? amt : parseFloat(amt);
          if (!isNaN(num)) {
            sum += num;
          }
        }
      });
      setTotal(sum);
      setShowTotal(true);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <div style={{ flex: 2 }}>
        <h2>My Subscriptions</h2>
        {subscriptions.map(sub => (
          <div key={sub.id} style={{ margin: '8px 0', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{sub.name}</span>
              <button
                style={{ marginLeft: 8, padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                onClick={async () => {
                  setOpenDropdown(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                  // Always fetch details from backend when button is clicked
                  try {
                    const res = await fetch(`http://patcav.shop/api/account/subscription/${sub.id}/`, {
                      method: 'GET',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setDetailsCache(cache => ({ ...cache, [sub.id]: data }));
                    }
                  } catch (err) {}
                }}
              >
                {openDropdown[sub.id] ? 'Hide Details' : 'Show Details'}
              </button>
              <button
                style={{ marginLeft: 8, padding: '4px 12px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete ${sub.name}?`)) {
                    try {
                      const res = await fetch(`http://patcav.shop/api/account/subscription/${sub.id}/delete/`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                      });
                      if (res.ok) {
                        setSubscriptions(subs => subs.filter(s => s.id !== sub.id));
                      } else {
                        alert('Failed to delete subscription.');
                      }
                    } catch (err) {
                      alert('Network error while deleting subscription.');
                    }
                  }
                }}
              >
                Delete
              </button>
            </div>
            {openDropdown[sub.id] && detailsCache[sub.id] && (
              <div style={{ marginTop: 8, background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                {detailsCache[sub.id].description && <div><b>Description:</b> {detailsCache[sub.id].description}</div>}
                {detailsCache[sub.id].first_date && <div><b>First Date:</b> {detailsCache[sub.id].first_date}</div>}
                {detailsCache[sub.id].last_date && <div><b>Last Date:</b> {detailsCache[sub.id].last_date}</div>}
                {detailsCache[sub.id].frequency && <div><b>Frequency:</b> {detailsCache[sub.id].frequency}</div>}
                {detailsCache[sub.id].average_amount && <div><b>Average Amount:</b> {detailsCache[sub.id].average_amount}</div>}
                {detailsCache[sub.id].last_amount && <div><b>Last Amount:</b> {detailsCache[sub.id].last_amount}</div>}
                {detailsCache[sub.id].is_active !== undefined && <div><b>Is Active:</b> {detailsCache[sub.id].is_active ? 'Yes' : 'No'}</div>}
                {detailsCache[sub.id].predicted_next_date && <div><b>Predicted Next Date:</b> {detailsCache[sub.id].predicted_next_date}</div>}
                {detailsCache[sub.id].last_user_modified_time && <div><b>Last User Modified Time:</b> {detailsCache[sub.id].last_user_modified_time}</div>}
                {detailsCache[sub.id].status && <div><b>Status:</b> {detailsCache[sub.id].status}</div>}
                {detailsCache[sub.id].website_url && (
                  <div>
                    <b>Website:</b> <a href={detailsCache[sub.id].website_url} target="_blank" rel="noopener noreferrer">{detailsCache[sub.id].website_url}</a>
                  </div>
                )}
                {/* Show Payment History Button */}
                {detailsCache[sub.id].transaction_ids && Array.isArray(detailsCache[sub.id].transaction_ids) && detailsCache[sub.id].transaction_ids.length > 0 && (
                  <button
                    style={{ marginTop: 12, padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                    onClick={async () => {
                      // POST transaction_ids to backend
                      const requestBody = {
                        access_token: accessToken,
                        transaction_ids: detailsCache[sub.id].transaction_ids
                      };
                      console.log('Payment History Request:', requestBody);
                      try {
                        const res = await fetch('http://patcav.shop/api/account/get_transactions/', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify(requestBody)
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setPaymentHistory(hist => ({ ...hist, [sub.id]: data.transactions }));
                        } else {
                          alert('Failed to fetch payment history.');
                        }
                      } catch (err) {
                        alert('Network error while fetching payment history.');
                      }
                    }}
                  >
                    Show Payment History
                  </button>
                )}
                {/* Payment History Display */}
                {paymentHistory[sub.id] && Array.isArray(paymentHistory[sub.id]) && paymentHistory[sub.id].length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <b>Payment History:</b>
                    <ul style={{ paddingLeft: 18 }}>
                      {paymentHistory[sub.id].map(tx => (
                        <li key={tx.transaction_id}>
                          {tx.date}: ${tx.amount} - {tx.name || tx.merchant_name || 'Transaction'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div style={{ margin: '24px 0' }}>
          <TotalPriceButton
            averages={averages}
            subscriptions={subscriptions}
            show={showTotal}
            total={total}
            onToggle={handleToggleTotal}
          />
        </div>
      </div>
      <div style={{ flex: 1, marginLeft: 32 }}>
        {notifications.length > 0 && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: 6, padding: 16, color: '#856404', fontWeight: 500 }}>
            <h4 style={{ marginTop: 0 }}>Notifications</h4>
            <ul style={{ paddingLeft: 18 }}>
              {notifications.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

export default SubscriptionList;






