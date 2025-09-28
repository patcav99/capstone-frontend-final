import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

// TestID 7: prompts for sign in credentials
it('prompts the user to enter sign in credentials when a subscription is clicked', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText('Netflix')).toBeInTheDocument());
  userEvent.click(screen.getByText('Netflix'));
  await waitFor(() => {
    const matches = screen.getAllByText(/sign in|login|email|password/i);
    expect(matches.length).toBeGreaterThan(0);
  });
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