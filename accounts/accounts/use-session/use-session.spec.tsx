import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockCustomer } from '@acme-modular/platform.entities.customer';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import { SessionProvider, useSession, sessionMockRoutes } from './use-session.js';

const client = createHttpClient({ transport: createMockTransport(sessionMockRoutes, { latencyMs: 0 }) });

function wrapper({ children }: { children?: ReactNode }) {
  return <SessionProvider client={client}>{children}</SessionProvider>;
}

it('signs in with the demo credentials', async () => {
  const { result } = renderHook(() => useSession(), { wrapper });
  expect(result.current.status).toBe('signed-out');
  await act(() => result.current.signIn('jordan@acme.example', 'acme'));
  expect(result.current.status).toBe('signed-in');
  expect(result.current.customer?.firstName).toBe('Jordan');
  expect(result.current.error).toBeUndefined();
});

it('stays signed out with an error on a 401', async () => {
  const { result } = renderHook(() => useSession(), { wrapper });
  await act(() => result.current.signIn('jordan@acme.example', 'wrong'));
  expect(result.current.status).toBe('signed-out');
  expect(result.current.customer).toBeUndefined();
  expect(result.current.error?.message).toBe('Incorrect email or password.');
});

it('signs out a signed-in customer', () => {
  const { result } = renderHook(() => useSession(), {
    wrapper: ({ children }) => <SessionProvider initialCustomer={mockCustomer()}>{children}</SessionProvider>,
  });
  expect(result.current.status).toBe('signed-in');
  act(() => result.current.signOut());
  expect(result.current.status).toBe('signed-out');
  expect(result.current.customer).toBeUndefined();
});

it('throws outside a SessionProvider', () => {
  // React logs the render error; keep the test output clean.
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => renderHook(() => useSession())).toThrow(/SessionProvider/);
  consoleError.mockRestore();
});
