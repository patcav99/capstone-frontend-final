import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import SubscriptionList from './SubscriptionList';

// Improved fetch mock for all tests
beforeEach(() => {
  global.fetch = jest.fn((url, options) => {
    if (options && options.method === 'DELETE') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'Netflix' },
        { id: 2, name: 'DeleteMe' },
        { id: 3, name: 'Peacock' },
      ]),
    });
  });
  window.confirm = jest.fn(() => true);
});

afterEach(() => {
  global.fetch.mockClear();
  window.confirm.mockClear();
});



// TestID 10: removes subscription from UI list when user clicks delete
it('removes subscription from UI list when user clicks delete', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText('DeleteMe')).toBeInTheDocument());
  const deleteButton = screen.getAllByText('Delete').find(btn => btn.parentElement.textContent.includes('DeleteMe'));
  userEvent.click(deleteButton);
  await waitFor(() => expect(screen.queryByText('DeleteMe')).not.toBeInTheDocument());
});

// TestID 5: displays all subscriptions at startup
it('displays all subscriptions from the database in the UI at startup', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Peacock')).toBeInTheDocument();
    expect(screen.getByText('DeleteMe')).toBeInTheDocument();
  });
});

// TestID 3: SubscriptionList renders all subscriptions
it('renders all subscriptions in the list', () => {
  const subscriptions = [
    { id: 1, name: 'Netflix' },
    { id: 2, name: 'Test Subscription' },
    { id: 3, name: 'Peacock' },
  ];
  render(<SubscriptionList subscriptions={subscriptions} />);
  subscriptions.forEach(sub => {
    expect(screen.getByText(sub.name)).toBeInTheDocument();
  });
});

// TestID 4: shows a new subscription in the UI list
it('shows a new subscription in the UI list', () => {
  const subscriptions = [
    { id: 1, name: 'Netflix' },
    { id: 2, name: 'Test Subscription' },
    { id: 3, name: 'Peacock' },
  ];
  const newSubscriptions = [...subscriptions, { id: 4, name: 'Disney+' }];
  render(<SubscriptionList subscriptions={newSubscriptions} />);
  expect(screen.getByText('Disney+')).toBeInTheDocument();
});

describe('SubscriptionList', () => {
  it('renders cancel button with correct URL for active subscription', async () => {
    const subscriptions = [
      {
        id: 1,
        name: 'Netflix',
        is_active: true,
        // cancel_url is not used in the list, only in detailsCache
      }
    ];
    // Mock fetch for details endpoint
    global.fetch = jest.fn((url, options) => {
      if (url.includes('/api/account/subscription/1/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            name: 'Netflix',
            is_active: true,
            cancel_url: 'https://example.com/cancel/Netflix',
            description: 'Streaming service',
            first_date: '2023-01-01',
            last_date: '2023-09-01',
            frequency: 'monthly',
            average_amount: 10.99,
            last_amount: 10.99,
            predicted_next_date: '2023-12-01',
            last_user_modified_time: '2023-09-01T12:00:00Z',
            status: 'active'
          }),
        });
      }
      // Default mock for other fetches
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
    render(
      <SubscriptionList
        subscriptions={subscriptions}
        setSubscriptions={() => {}}
        accessToken="dummy"
      />
    );
    // Open details dropdown
    const showDetailsButton = screen.getByText(/Show Details/i);
    fireEvent.click(showDetailsButton);
    // Wait for detailsCache to populate and button to appear
    await waitFor(() => {
      const cancelButton = screen.getByText(/Cancel Subscription/i);
      expect(cancelButton.closest('a')).toHaveAttribute('href', 'https://example.com/cancel/Netflix');
    });
  });

  it('renders reactivate button with correct URL for past subscription', async () => {
    const subscriptions = [
      {
        id: 2,
        name: 'Hulu',
        is_active: false,
        // reactivate_url is not used in the list, only in detailsCache
      }
    ];
    // Mock fetch for details endpoint
    global.fetch = jest.fn((url, options) => {
      if (url.includes('/api/account/subscription/2/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 2,
            name: 'Hulu',
            is_active: false,
            reactivate_url: 'https://example.com/reactivate/hulu',
            description: 'Streaming service',
            first_date: '2023-01-01',
            last_date: '2023-09-01',
            frequency: 'monthly',
            average_amount: 10.99,
            last_amount: 10.99,
            predicted_next_date: '2023-12-01',
            last_user_modified_time: '2023-09-01T12:00:00Z',
            status: 'inactive'
          }),
        });
      }
      // Default mock for other fetches
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
    render(
      <SubscriptionList
        subscriptions={subscriptions}
        setSubscriptions={() => {}}
        accessToken="dummy"
      />
    );
    // Open details dropdown
    const showDetailsButton = screen.getByText(/Show Details/i);
    fireEvent.click(showDetailsButton);
    // Wait for detailsCache to populate and button to appear
    await waitFor(() => {
      const reactivateButton = screen.getByText(/Reactivate Subscription/i);
      expect(reactivateButton.closest('a')).toHaveAttribute('href', 'https://example.com/reactivate/hulu');
    });
  });
});