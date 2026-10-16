import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import { SessionProvider, sessionMockRoutes } from '@acme-modular/accounts.accounts.use-session';
import { LoginForm } from './login-form.js';

const client = createHttpClient({ transport: createMockTransport(sessionMockRoutes, { latencyMs: 0 }) });

function signInWith(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/Password/), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

it('signs in with typed credentials and reports the customer', async () => {
  const onSignedIn = vi.fn();
  render(
    <SessionProvider client={client}>
      <LoginForm onSignedIn={onSignedIn} />
    </SessionProvider>
  );
  signInWith('jordan@acme.example', 'acme');
  await waitFor(() => expect(onSignedIn).toHaveBeenCalledTimes(1));
  expect(onSignedIn.mock.calls[0][0].email).toBe('jordan@acme.example');
});

it('shows an alert when the credentials are rejected', async () => {
  const onSignedIn = vi.fn();
  render(
    <SessionProvider client={client}>
      <LoginForm onSignedIn={onSignedIn} />
    </SessionProvider>
  );
  signInWith('jordan@acme.example', 'nope');
  await waitFor(() => expect(screen.getByText(/Incorrect email or password/)).toBeTruthy());
  expect(onSignedIn).not.toHaveBeenCalled();
});

it('asks for missing fields without calling the backend', () => {
  const post = vi.fn();
  render(
    <SessionProvider client={{ ...client, post }}>
      <LoginForm />
    </SessionProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText('Enter your email.')).toBeTruthy();
  expect(post).not.toHaveBeenCalled();
});
