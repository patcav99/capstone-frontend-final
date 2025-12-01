import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import Modal from 'react-modal';
import RecommendationPanel from './RecommendationPanel';

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

const SubscriptionList = forwardRef(({ subscriptions, setSubscriptions, jwtToken, plaidToken }, ref) => {
  const [showRankModal, setShowRankModal] = useState(false);
  const [rankInputs, setRankInputs] = useState({});
  const [pendingBudget, setPendingBudget] = useState('');
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const activeSubs = subscriptions.filter(sub => {
    if (sub.is_active === false) return false;
    if (sub.last_date) {
      const lastDate = new Date(sub.last_date);
      if (now - lastDate > THIRTY_DAYS_MS) return false;
    }
    return true;
  });
  const inactiveSubs = subscriptions.filter(sub => {
    if (sub.is_active === false) return true;
    if (sub.last_date) {
      const lastDate = new Date(sub.last_date);
      if (now - lastDate > THIRTY_DAYS_MS) return true;
    }
    return false;
  });
  // Debug log for inactive subscriptions
  console.log('DEBUG inactiveSubs:', inactiveSubs);
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
  const [recommendations, setRecommendations] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);

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
          // Only consider active subscriptions for notifications
          const activeSubsOnly = data.subscriptions.filter(sub => sub.is_active === true);
          console.log('DEBUG subscriptions here:', data.subscriptions);
          console.log('DEBUG activeSubsOnly for notifications:', activeSubsOnly);
          activeSubsOnly.forEach(sub => {
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
            const sub = activeSubsOnly.find(s => s.id === Number(id));
            if (!sub) return;
            if (
              prevAverages[id] !== undefined &&
              avgMap[id] !== undefined &&
              avgMap[id] !== prevAverages[id]
            ) {
              newNotifications.push(
                `Subscription "${sub.name || id}" changed its rate from $${prevAverages[id]} to $${avgMap[id]}`
              );
            } else if (
              prevAverages[id] === undefined && avgMap[id] !== undefined
            ) {
              newNotifications.push(
                `Subscription "${sub.name || id}" rate is $${avgMap[id]}`
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

  // Initial fetch on mount, only if jwtToken exists
  useEffect(() => {
    if (jwtToken) {
      fetchAndCheckAverages();
    }
    // Debug log after fetching mock transactions
    console.log('DEBUG subscriptions after fetch:', subscriptions);
    const inactiveSubs = subscriptions.filter(sub => sub.is_active === false);
    console.log('DEBUG inactiveSubs after fetch:', inactiveSubs);
  }, [jwtToken]);

  const handleToggleTotal = () => {
    if (showTotal) {
      setShowTotal(false);
    } else {
      let sum = 0;
      activeSubs.forEach(sub => {
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
    <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'row' }}>
      <div style={{ flex: 2, minWidth: 400 }}>
        <div style={{ flex: 2 }}>
          <h2 className="heading-section">My Subscriptions</h2>
          {activeSubs.map(sub => (
            <div key={sub.id} style={{ margin: '8px 0', padding: '8px', border: '1px solid #ccc', borderRadius: 4, background: '#218c4a', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>{sub.name || sub.merchant_name}</span>
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
                        setDetailsCache(cache => {
                          const updated = { ...cache, [sub.id]: data };
                          console.log('DEBUG: detailsCache for sub.id', sub.id, updated[sub.id]);
                          return updated;
                        });
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
                <div style={{ marginTop: 8, background: '#218c4a', padding: 10, borderRadius: 4, border: '1px solid #eee', color: '#fff' }}>
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
                  {/* Cancel button only in details dropdown */}
                  {(detailsCache[sub.id].cancel_url || detailsCache[sub.id].reactivate_url) && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      {/* Only show Cancel button for active subscriptions */}
                      {activeSubs.some(s => s.id === sub.id) && detailsCache[sub.id].cancel_url && (
                        <a
                          href={detailsCache[sub.id].cancel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 16px',
                            background: '#ff9800',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Cancel Subscription
                        </a>
                      )}
                      {/* Only show Reactivate button for inactive subscriptions */}
                      {inactiveSubs.some(s => s.id === sub.id) && detailsCache[sub.id].reactivate_url && (
                        <a
                          href={detailsCache[sub.id].reactivate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 16px',
                            background: '#388e3c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Reactivate Subscription
                        </a>
                      )}
                    </div>
                  )}
                  {/* Show Payment History Button */}
                  {detailsCache[sub.id].transaction_ids && Array.isArray(detailsCache[sub.id].transaction_ids) && detailsCache[sub.id].transaction_ids.length > 0 && (
                    <button
                      style={{ marginTop: 12, padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                      onClick={async () => {
                        // Only send Plaid access token for Plaid-linked subscriptions
                        if ((detailsCache[sub.id].merchant_name || detailsCache[sub.id].name) && plaidToken) {
                          const requestBody = {
                            access_token: plaidToken,
                            transaction_ids: detailsCache[sub.id].transaction_ids
                          };
                          console.log('DEBUG Show Payment History: requestBody', requestBody);
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
                        } else {
                          alert('Payment history is only available for Plaid-linked subscriptions.');
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
        </div>
        {/* Past Subscriptions List */}
        <div style={{ flex: 2, marginTop: 40 }}>
          <h2 className="heading-section">Past Subscriptions</h2>
          {inactiveSubs.length === 0 && <div>No past subscriptions found.</div>}
          {inactiveSubs.map(sub => (
            <div key={sub.id} style={{ margin: '8px 0', padding: '8px', border: '1px solid #eee', borderRadius: 4, background: '#218c4a', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1, color: '#888' }}>{sub.name || sub.merchant_name}</span>
                <button
                  style={{ marginLeft: 8, padding: '4px 12px', background: '#aaa', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  onClick={async () => {
                    setOpenDropdown(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                    try {
                      const res = await fetch(`http://patcav.shop/api/account/subscription/${sub.id}/`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setDetailsCache(cache => {
                          const updated = { ...cache, [sub.id]: data };
                          console.log('DEBUG: detailsCache for sub.id', sub.id, updated[sub.id]);
                          return updated;
                        });
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
                <div style={{ marginTop: 8, background: '#218c4a', padding: 10, borderRadius: 4, border: '1px solid #eee', color: '#fff' }}>
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
                  {/* Cancel/Reactivate buttons if available */}
                  {(detailsCache[sub.id].cancel_url || detailsCache[sub.id].reactivate_url) && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      {/* Only show Cancel button for active subscriptions */}
                      {activeSubs.some(s => s.id === sub.id) && detailsCache[sub.id].cancel_url && (
                        <a
                          href={detailsCache[sub.id].cancel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 16px',
                            background: '#ff9800',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Cancel Subscription
                        </a>
                      )}
                      {/* Only show Reactivate button for inactive subscriptions */}
                      {inactiveSubs.some(s => s.id === sub.id) && detailsCache[sub.id].reactivate_url && (
                        <a
                          href={detailsCache[sub.id].reactivate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 16px',
                            background: '#388e3c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Reactivate Subscription
                        </a>
                      )}
                    </div>
                  )}
                  {/* Show Payment History Button */}
                  {detailsCache[sub.id].transaction_ids && Array.isArray(detailsCache[sub.id].transaction_ids) && detailsCache[sub.id].transaction_ids.length > 0 && (
                    <button
                      style={{ marginTop: 12, padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                      onClick={async () => {
                        // Only send Plaid access token for Plaid-linked subscriptions
                        if (detailsCache[sub.id].merchant_name && plaidToken) {
                          const requestBody = {
                            access_token: plaidToken,
                            transaction_ids: detailsCache[sub.id].transaction_ids
                          };
                          console.log('DEBUG Show Payment History: requestBody', requestBody);
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
                        } else {
                          alert('Payment history is only available for Plaid-linked subscriptions.');
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
          <div style={{ margin: '24px 0', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <TotalPriceButton
              averages={averages}
              subscriptions={activeSubs}
              show={showTotal}
              total={total}
              onToggle={handleToggleTotal}
            />
            <button
              style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
              onClick={() => {
                const userBudget = window.prompt('Enter your monthly budget (USD):');
                if (!userBudget || isNaN(userBudget)) {
                  alert('Please enter a valid number for your budget.');
                  return;
                }
                if (!plaidToken) {
                  alert('Plaid access token required for budget recommendations.');
                  return;
                }
                const latestJwtToken = localStorage.getItem('jwtToken') || jwtToken;
                if (!latestJwtToken) {
                  alert('You must be logged in to get budget recommendations.');
                  return;
                }
                setPendingBudget(userBudget);
                // Initialize rankInputs with empty values
                const initialRanks = {};
                activeSubs.forEach(sub => {
                  initialRanks[sub.id] = '';
                });
                setRankInputs(initialRanks);
                setShowRankModal(true);
              }}
            >
              Budget Recommendations
            </button>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, marginLeft: 32, minWidth: 340, display: 'flex', flexDirection: 'column' }}>
        <RecommendationPanel recommendations={recommendations} loading={recLoading} error={recError} subscriptions={subscriptions} />
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
      {/* Ranking Modal */}
      <Modal
        isOpen={showRankModal}
        onRequestClose={() => setShowRankModal(false)}
        contentLabel="Rank Subscriptions"
        ariaHideApp={false}
        style={{ content: { maxWidth: 400, margin: 'auto', padding: 24, borderRadius: 8 } }}
      >
        <h3>Rank Your Subscriptions</h3>
        <p>Enter a unique rank for each subscription (1 = highest usage):</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ranksArr = Object.entries(rankInputs)
              .map(([id, val]) => ({ id: parseInt(id), rank: parseInt(val) }))
              .filter(x => !isNaN(x.id) && !isNaN(x.rank));
            if (ranksArr.length !== activeSubs.length) {
              alert('Please enter a rank for every subscription.');
              return;
            }
            const rankVals = ranksArr.map(x => x.rank);
            const uniqueRanks = new Set(rankVals);
            if (uniqueRanks.size !== activeSubs.length || Math.min(...rankVals) !== 1 || Math.max(...rankVals) !== activeSubs.length) {
              alert(`Ranks must be unique and between 1 and ${activeSubs.length}.`);
              return;
            }
            // Sort by rank
            ranksArr.sort((a, b) => a.rank - b.rank);
            const ranks = ranksArr.map(x => x.id);
            setShowRankModal(false);
            const latestJwtToken = localStorage.getItem('jwtToken') || jwtToken;
            try {
              // Always get the latest JWT from localStorage
              const latestJwtToken = localStorage.getItem('jwtToken') || jwtToken;
              const res = await fetch('http://patcav.shop/api/account/recommend_subscriptions_to_keep/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${latestJwtToken}`
                },
                credentials: 'include',
                body: JSON.stringify({ budget: pendingBudget, access_token: plaidToken, ranks })
              });
              if (res.status === 401) {
                alert('Session expired or not authenticated. Please log in again.');
                return;
              }
              if (res.ok) {
                const data = await res.json();
                setRecommendations(data);
                setRecError(null);
                setRecLoading(false);
                // Map IDs to names for keep/cancel
                const idToName = {};
                activeSubs.forEach(sub => {
                  idToName[sub.id] = sub.name || sub.merchant_name;
                });
                let msg = `Budget Recommendations:\n`;
                msg += `Subscriptions to KEEP (${data.keep.length}):\n`;
                msg += data.keep.map(id => `- ${idToName[id] || id}`).join('\n') + '\n';
                msg += `Subscriptions to CANCEL (${data.cancel.length}):\n`;
                msg += data.cancel.map(id => `- ${idToName[id] || id}`).join('\n') + '\n';
                msg += `Total Subscriptions Cost: $${data.total_subscriptions}\n`;
                msg += `Other Transactions: $${data.other_transactions}\n`;
                msg += `All Spending: $${data.all_spending}`;
                window.alert(msg);
              } else {
                setRecError('Failed to fetch budget recommendations.');
                setRecLoading(false);
              }
            } catch (err) {
              setRecError('Network error while fetching budget recommendations.');
              setRecLoading(false);
            }
          }}
        >
          {activeSubs.map(sub => (
            <div key={sub.id} style={{ marginBottom: 12 }}>
              <label>
                {sub.name || sub.merchant_name}
                <input
                  type="number"
                  min={1}
                  max={activeSubs.length}
                  value={rankInputs[sub.id]}
                  onChange={e => setRankInputs(ranks => ({ ...ranks, [sub.id]: e.target.value }))}
                  style={{ marginLeft: 12, width: 60 }}
                  required
                />
              </label>
            </div>
          ))}
          <button type="submit" style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
            Submit Rankings
          </button>
        </form>
      </Modal>
    </div>
  ); 
});

export default SubscriptionList;