import React, { useState } from 'react';

function SubscriptionList({ subscriptions, setSubscriptions }) {
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [openDropdown, setOpenDropdown] = useState({}); // Track which dropdowns are open
  const [detailsCache, setDetailsCache] = useState({}); // Cache details by sub.id



  // Helper: Get login URL for subscription
  // Generalized: get login URL for any subscription
  const getLoginUrl = (name) => {
    const backendRedirect = encodeURIComponent(`https://patcav.shop/api/account/manual_login_callback?subscription=${encodeURIComponent(name)}`);
    const urls = {
      playstation: `https://my.account.sony.com/sonyacct/signin/?duid=000000070009010085f0bccffad9e2662fa4bc3b157345eb7e7e27b1b0da75394910ebe57898f2ff&response_type=code&client_id=e4a62faf-4b87-4fea-8565-caaabb3ac918&scope=web%3Acore&access_type=offline&state=bff965675bb143e92e4c1151678c2c4b758790dbe0c21cb7188eb2819a8f6e30&service_entity=urn%3Aservice-entity%3Apsn&ui=pr&smcid=web%3Apdc&redirect_uri=${backendRedirect}&auth_ver=v3&error=login_required&error_code=4165&error_description=User+is+not+authenticated&no_captcha=true&cid=1e86060e-8330-48e0-a3ba-24ba1b23ab7d#/signin/input/id`,
      peacock: `https://www.peacocktv.com/signin?redirect_uri=${backendRedirect}`,
      spotify: `https://accounts.spotify.com/en/login?continue=${backendRedirect}`,
      // Add more as needed
    };
    return urls[name.toLowerCase()] || '';
  };

  return (
    <div>
      <h2>Subscriptions</h2>
      {subscriptions.map(sub => (
        <div key={sub.id} style={{ margin: '8px 0', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ flex: 1 }}>{sub.name}</span>
            <button
              style={{ marginLeft: 8, padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              onClick={async () => {
                setOpenDropdown(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                // Only fetch if opening and not already cached
                if (!openDropdown[sub.id] && !detailsCache[sub.id]) {
                  try {
                    const res = await fetch(`http://patcav.shop/api/account/subscription/${sub.id}/`, {
                      method: 'GET',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                    });
                    if (res.ok) {
                      const data = await res.json();
                      console.log('Fetched subscription details:', data); // Debug print
                      setDetailsCache(cache => ({ ...cache, [sub.id]: data }));
                    }
                  } catch (err) {
                    // Optionally handle error
                  }
                }
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
          {openDropdown[sub.id] && (
            <div style={{ marginTop: 8, background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
              {/* Display all available details for the subscription from detailsCache */}
              {detailsCache[sub.id] ? (
                <>
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
                  {/* If no details, show a message */}
                  {!detailsCache[sub.id].description && !detailsCache[sub.id].first_date && !detailsCache[sub.id].last_date && !detailsCache[sub.id].frequency && !detailsCache[sub.id].average_amount && !detailsCache[sub.id].last_amount && detailsCache[sub.id].is_active === undefined && !detailsCache[sub.id].predicted_next_date && !detailsCache[sub.id].last_user_modified_time && !detailsCache[sub.id].status && (
                    <div>No details available.</div>
                  )}
                </>
              ) : (
                <div>Loading details...</div>
              )}
            </div>
          )}
        </div>
      ))}


    
    </div>
  );
}

export default SubscriptionList;
