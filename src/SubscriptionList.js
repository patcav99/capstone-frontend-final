import React, { useState } from 'react';
import LoginModal from './LoginModal';

function SubscriptionList({ subscriptions }) {
  const [showLogin, setShowLogin] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [seleniumResult, setSeleniumResult] = useState(null);

  // When a subscription is clicked, prompt for email/password
  const handleSubscriptionClick = (sub) => {
    setSelectedSub(sub);
    setShowLogin(true);
    setSeleniumResult(null);
  };

  // Handle Selenium login
  const handleSeleniumLogin = async (email, password) => {
    setShowLogin(false);
    if (!selectedSub) return;
    try {
      const res = await fetch('http://patcav.shop/api/account/subscription-selenium-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_name: selectedSub.name,
          email,
          password
        })
      });
      const data = await res.json();
      setSeleniumResult(data);
    } catch (err) {
      setSeleniumResult({ success: false, message: 'Network error' });
    }
  };

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
        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', margin: '8px 0', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}>
          <span style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleSubscriptionClick(sub)}>{sub.name}</span>
          <button
            style={{ marginLeft: 12, padding: '4px 12px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
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
                    // Remove from local list
                    if (typeof window !== 'undefined') {
                      window.location.reload(); // simplest way to refresh list
                    }
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
      ))}
      {showLogin && selectedSub && (
        <LoginModal
          subscriptionName={selectedSub.name}
          onSeleniumLogin={handleSeleniumLogin}
          onClose={() => setShowLogin(false)}
        />
      )}
      {seleniumResult && (
        <div style={{ marginTop: 24 }}>
          <h3>Selenium Login Result</h3>
          <pre>{JSON.stringify(seleniumResult, null, 2)}</pre>
          {/* If network error, show redirect button for any subscription */}
          {seleniumResult.message && seleniumResult.message.toLowerCase().includes('network error') && selectedSub && getLoginUrl(selectedSub.name) && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => window.open(getLoginUrl(selectedSub.name), '_blank')}
                style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}
              >
                Go to {selectedSub.name} Sign-In Page
              </button>
            </div>
          )}
        </div>
      )}

    
    </div>
  );
}

export default SubscriptionList;
