import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Customer, plainMockCustomer } from '@acme-modular/platform.entities.customer';
import type { PlainCustomer } from '@acme-modular/platform.entities.customer';
import { createHttpClient, createMockTransport, HttpError } from '@acme-modular/platform.utils.http-client';
import type { HttpClient, MockRoutes } from '@acme-modular/platform.utils.http-client';

export type SessionStatus = 'signed-out' | 'signing-in' | 'signed-in';

export type Session = {
  /** the signed-in customer, if any. */
  customer?: Customer;
  status: SessionStatus;
  /** why the last sign-in failed. cleared on the next attempt and on sign-out. */
  error?: Error;
  /** signs in with email and password. never rejects: failures land in `error`. */
  signIn(email: string, password: string): Promise<void>;
  signOut(): void;
  /** replaces the session customer, e.g. after adding an address. */
  updateCustomer(customer: Customer): void;
};

export type SessionProviderProps = {
  children?: ReactNode;
  /** start signed in as this customer, e.g. in previews and tests. */
  initialCustomer?: Customer;
  /** the API client. defaults to an in-memory mock backend. */
  client?: HttpClient;
};

/** the demo account accepted by the mock backend. */
export const demoCredentials = { email: 'jordan@acme.example', password: 'acme' } as const;

/**
 * Mock routes for `POST /session`: the demo credentials return the demo
 * customer, anything else answers 401.
 */
export const sessionMockRoutes: MockRoutes = {
  'POST /session': async (request) => {
    const { email = '', password = '' } = (await request.json()) as { email?: string; password?: string };
    if (email.trim().toLowerCase() === demoCredentials.email && password === demoCredentials.password) {
      return plainMockCustomer;
    }
    // the mock transport answers 200 for anything a handler returns, so a 401 is thrown instead.
    throw new HttpError(401, request.url, { error: 'invalid credentials' });
  },
};

const mockClient = createHttpClient({ transport: createMockTransport(sessionMockRoutes, { latencyMs: 300 }) });

const SessionContext = createContext<Session | undefined>(undefined);

function toSignInError(error: unknown): Error {
  if (error instanceof HttpError && error.status === 401) return new Error('Incorrect email or password.');
  return error instanceof Error ? error : new Error('Sign-in failed. Please try again.');
}

/**
 * Holds the signed-in customer for everything below it. Wrap the app (or a
 * preview) once; read it with `useSession`.
 */
export function SessionProvider({ children, initialCustomer, client = mockClient }: SessionProviderProps) {
  const [customer, setCustomer] = useState<Customer | undefined>(initialCustomer);
  const [status, setStatus] = useState<SessionStatus>(initialCustomer ? 'signed-in' : 'signed-out');
  const [error, setError] = useState<Error | undefined>();
  // bumped on every sign-in and sign-out, so a slow response can't revive a session the user already left.
  const attempt = useRef(0);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const current = ++attempt.current;
      setStatus('signing-in');
      setError(undefined);
      try {
        const plain = await client.post<PlainCustomer>('/session', { email, password });
        if (current !== attempt.current) return;
        setCustomer(Customer.from(plain));
        setStatus('signed-in');
      } catch (caught) {
        if (current !== attempt.current) return;
        setCustomer(undefined);
        setError(toSignInError(caught));
        setStatus('signed-out');
      }
    },
    [client]
  );

  const signOut = useCallback(() => {
    attempt.current += 1;
    setCustomer(undefined);
    setError(undefined);
    setStatus('signed-out');
  }, []);

  const updateCustomer = useCallback((next: Customer) => setCustomer(next), []);

  const value = useMemo<Session>(
    () => ({ customer, status, error, signIn, signOut, updateCustomer }),
    [customer, status, error, signIn, signOut, updateCustomer]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * The current session: the customer, the sign-in status and the actions to
 * change them. Must be used inside a `SessionProvider`.
 */
export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside a <SessionProvider>.');
  return session;
}
