import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { Card } from '@acme-modular/design.ui.card';
import { SessionProvider, useSession } from '@acme-modular/accounts.accounts.use-session';
import { LoginForm } from './login-form.js';

function SessionStatus() {
  const { status, customer } = useSession();
  return <p>{status === 'signed-in' ? `Signed in as ${customer?.email}` : `Status: ${status}`}</p>;
}

export const BasicLoginForm = () => (
  <AcmeTheme>
    <SessionProvider>
      <LoginForm />
      <p>Demo account: jordan@acme.example / acme</p>
    </SessionProvider>
  </AcmeTheme>
);

export const LoginFormInCard = () => (
  <AcmeTheme>
    <SessionProvider>
      <Card title="Sign in to ACME" footer={<span>Try jordan@acme.example / acme, or a wrong password.</span>}>
        <LoginForm />
      </Card>
    </SessionProvider>
  </AcmeTheme>
);

export const LoginFormWithStatus = () => (
  <AcmeTheme>
    <SessionProvider>
      <LoginForm onSignedIn={(customer) => alert(`Welcome back, ${customer.firstName}`)} />
      <SessionStatus />
    </SessionProvider>
  </AcmeTheme>
);
