import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockCustomer } from '@acme-modular/platform.entities.customer';
import { plainMockOrders } from '@acme-modular/platform.entities.order';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import { SessionProvider } from '@acme-modular/accounts.accounts.use-session';
import { ProfilePage } from './profile-page.js';

const client = createHttpClient({
  transport: createMockTransport({ 'GET /orders': () => plainMockOrders }, { latencyMs: 0 }),
});

function renderSignedIn() {
  return render(
    <SessionProvider initialCustomer={mockCustomer()}>
      <ProfilePage client={client} />
    </SessionProvider>
  );
}

it('shows the login form when signed out', () => {
  render(
    <SessionProvider>
      <ProfilePage client={client} />
    </SessionProvider>
  );
  expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
  expect(screen.getByLabelText(/Email/)).toBeTruthy();
});

it('greets the customer and lists recent orders', async () => {
  renderSignedIn();
  expect(screen.getByRole('heading', { name: 'Hi, Jordan' })).toBeTruthy();
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Order o-1003' })).toBeTruthy());
  expect(screen.getByText('$602.00')).toBeTruthy();
});

it('updates the default address through the session', () => {
  renderSignedIn();
  fireEvent.click(screen.getByRole('button', { name: 'Make default' }));
  // Office was the default; now Home is, so Office offers the button instead.
  const home = screen.getByRole('heading', { name: 'Home' }).closest('article');
  expect(home?.textContent).toContain('Default');
});

it('signs out back to the login form', () => {
  renderSignedIn();
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
});
