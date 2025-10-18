
import React from 'react';
import { usePlaidLink } from 'react-plaid-link';


function BankLink({ setSubscriptions, onRecurringFetched, accessToken, setAccessToken }) {
  console.log("BankLink component mounted");
  const [linkToken, setLinkToken] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [balances, setBalances] = React.useState(null);
  const [transactions, setTransactions] = React.useState(null);
  const [recurring, setRecurring] = React.useState(null);
  const [useMockRecurring, setUseMockRecurring] = React.useState(false);
  // accessToken is now passed as a prop from App
  const fetchTransactions = () => {
    if (!setAccessToken) return;
    setStatus('Fetching transactions...');
    fetch('http://patcav.shop/api/account/get_transactions/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: setAccessToken }),
    })
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setStatus('Fetched transactions!');
      })
      .catch(() => setStatus('Failed to fetch transactions'));
  };

  React.useEffect(() => {
    console.log("Fetching link token...");
    fetch('http://patcav.shop/api/account/create_link_token/')
      .then(res => res.json())
      .then(data => {
        console.log('Link token response:', data);
         setLinkToken(data.link_token || data.linkToken || data.whateverTheKeyIs);
      })
      .catch((err) => {
        setStatus('Failed to fetch link token');
        console.error('Fetch error:', err);
      });
    }, []);

  const onSuccess = React.useCallback((public_token, metadata) => {
    fetch('http://patcav.shop/api/account/exchange_public_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token }),
    })
      .then(res => res.json())
      .then(data => {
        setStatus('Bank account linked!');
        if (typeof setAccessToken === 'function') {
          setAccessToken(data.access_token);
        }
      })
      .catch(() => setStatus('Failed to link account'));
  }, []);

  const config = {
    token: linkToken,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  const fetchBalances = () => {
    if (!accessToken) return;
    setStatus('Fetching balances...');
    fetch('/api/account/get_account_balances/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    })
      .then(res => res.json())
      .then(data => {
        setBalances(data);
        setStatus('Fetched balances!');
      })
      .catch(() => setStatus('Failed to fetch balances'));
  };

  const fetchRecurring = () => {
    if (!accessToken) return;
    setStatus('Fetching recurring transactions...');
    const url = useMockRecurring
      ? 'http://patcav.shop/api/account/get_recurring_transactions/?mock=1'
      : 'http://patcav.shop/api/account/get_recurring_transactions/';
  fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    })
  .then(res => res.json())
  .then(data => {
  setRecurring(data);
  setStatus('Fetched recurring transactions!');
  if (onRecurringFetched) onRecurringFetched();
        if (data && data.outflow_streams) {
          const newSubs = data.outflow_streams
            .filter(stream => stream.merchant_name)
            .map((stream, idx) => ({
              id: `plaid-${stream.merchant_name}-${idx}`,
              name: stream.merchant_name,
              description: stream.description,
              first_date: stream.first_date,
              last_date: stream.last_date,
              frequency: stream.frequency,
              average_amount: stream.average_amount?.amount,
              last_amount: stream.last_amount?.amount,
              is_active: stream.is_active,
              predicted_next_date: stream.predicted_next_date,
              last_user_modified_time: stream.last_user_modified_datetime,
              status: stream.status
            }));
          // Always send new subscriptions to backend to save website_url
          if (newSubs.length > 0) {
            console.log('POSTing new merchant subscriptions to backend (full payload):', newSubs);
            fetch('http://patcav.shop/api/account/receive-list/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: newSubs })
            })
              .then(res => res.json())
              .then(data => {
                if (data && data.data && data.data.saved_items) {
                  setSubscriptions(current => [
                    ...current,
                    ...data.data.saved_items.filter(s => !current.some(c => c.id === s.id))
                  ]);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => setStatus('Failed to fetch recurring transactions'));
  };


  return (
    <div>
      <button onClick={() => open()} disabled={!ready || !linkToken}>
        Link Bank Account
      </button>
      {status && <div>{status}</div>}
      {accessToken && (
        <button onClick={fetchBalances} style={{ marginLeft: 8 }}>
          Fetch Account Balances
        </button>
      )}
      {balances && (
        <pre style={{ textAlign: 'left', background: '#f4f4f4', padding: 10, marginTop: 10 }}>
          {JSON.stringify(balances, null, 2)}
        </pre>
      )}
      {accessToken && (
        <>
          <button onClick={() => setUseMockRecurring(v => !v)} style={{ marginLeft: 8 }}>
            {useMockRecurring ? 'Use Plaid Recurring' : 'Use Mock Recurring'}
          </button>
          <button onClick={fetchRecurring} style={{ marginLeft: 8 }}>
            Fetch Recurring Transactions
          </button>
        </>
      )}
      {recurring && (
        <pre style={{ textAlign: 'left', background: '#fffbe8', padding: 10, marginTop: 10 }}>
          {JSON.stringify(recurring, null, 2)}
        </pre>
      )}
      {accessToken && (
        <button onClick={fetchTransactions} style={{ marginLeft: 8 }}>
          Fetch Transactions
        </button>
      )}
      {transactions && (
        <pre style={{ textAlign: 'left', background: '#e8f7ff', padding: 10, marginTop: 10 }}>
          {JSON.stringify(transactions, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default BankLink;