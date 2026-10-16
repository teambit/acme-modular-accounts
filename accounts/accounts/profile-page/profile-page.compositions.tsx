import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { mockCustomer } from '@acme-modular/platform.entities.customer';
import { SessionProvider } from '@acme-modular/accounts.accounts.use-session';
import { ProfilePage } from './profile-page.js';

export const SignedOutProfile = () => (
  <AcmeTheme>
    <SessionProvider>
      <ProfilePage />
    </SessionProvider>
  </AcmeTheme>
);

export const SignedInProfile = () => (
  <AcmeTheme>
    <SessionProvider initialCustomer={mockCustomer()}>
      <ProfilePage />
    </SessionProvider>
  </AcmeTheme>
);
