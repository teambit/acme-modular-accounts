import classNames from 'classnames';
import { Customer } from '@acme-modular/platform.entities.customer';
import { Order, plainMockOrders } from '@acme-modular/platform.entities.order';
import type { OrderStatus, PlainOrder } from '@acme-modular/platform.entities.order';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import type { HttpClient } from '@acme-modular/platform.utils.http-client';
import { useFetch } from '@acme-modular/platform.hooks.use-fetch';
import { Alert } from '@acme-modular/design.ui.alert';
import { Badge } from '@acme-modular/design.ui.badge';
import type { BadgeTone } from '@acme-modular/design.ui.badge';
import { Button } from '@acme-modular/design.ui.button';
import { Card } from '@acme-modular/design.ui.card';
import { PriceTag } from '@acme-modular/design.ui.price-tag';
import { Spinner } from '@acme-modular/design.ui.spinner';
import { Stack } from '@acme-modular/design.ui.stack';
import { useSession } from '@acme-modular/accounts.accounts.use-session';
import { LoginForm } from '@acme-modular/accounts.accounts.login-form';
import { AddressBook } from '@acme-modular/accounts.accounts.address-book';
import styles from './profile-page.module.css';

export type ProfilePageProps = {
  /** the API client for recent orders. defaults to a mock backend over `mockOrders()`. */
  client?: HttpClient;
  className?: string;
};

/** how many orders the profile shows. */
const RECENT_ORDERS = 3;

const mockClient = createHttpClient({
  transport: createMockTransport({ 'GET /orders': () => plainMockOrders }, { latencyMs: 300 }),
});

const statusTone: Record<OrderStatus, BadgeTone> = {
  placed: 'neutral',
  paid: 'info',
  shipped: 'info',
  delivered: 'positive',
  cancelled: 'negative',
};

function formatDate(iso: string) {
  // UTC so the date matches the order record regardless of the viewer's time zone.
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function RecentOrders({ customerId, client }: { customerId: string; client: HttpClient }) {
  const { data, loading, error } = useFetch(
    () => client.get<PlainOrder[]>('/orders').then((plain) => plain.map((order) => Order.from(order))),
    [client]
  );

  if (loading && !data) return <Spinner label="Loading orders" />;
  if (error) return <Alert tone="negative" title="Couldn't load your orders">{error.message}</Alert>;

  const orders = (data ?? [])
    .filter((order) => order.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_ORDERS);

  if (orders.length === 0) return <p className={styles.muted}>No orders yet.</p>;

  return (
    <ul className={styles.orders}>
      {orders.map((order) => (
        <li key={order.id}>
          <Card
            title={`Order ${order.id}`}
            footer={
              <Stack direction="row" justify="space-between" align="center">
                <PriceTag cents={order.total.amountCents} currency={order.currency} />
                <Badge tone={statusTone[order.status]}>{order.status}</Badge>
              </Stack>
            }
          >
            <p className={styles.muted}>
              {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/**
 * The account page. Signed out, it shows the `LoginForm`; signed in, a
 * greeting, the editable `AddressBook` and the most recent orders. Must be
 * used inside a `SessionProvider`.
 */
export function ProfilePage({ client = mockClient, className }: ProfilePageProps) {
  const { customer, status, signOut, updateCustomer } = useSession();

  if (status !== 'signed-in' || !customer) {
    return (
      <main className={classNames(styles.profilePage, styles.signedOut, className)}>
        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.muted}>Sign in to manage your addresses and see your orders.</p>
        <LoginForm />
      </main>
    );
  }

  const selectDefault = (id: string) => updateCustomer(Customer.from({ ...customer.toObject(), defaultAddressId: id }));

  return (
    <main className={classNames(styles.profilePage, className)}>
      <Stack direction="row" justify="space-between" align="center" wrap>
        <div>
          <h1 className={styles.heading}>Hi, {customer.firstName}</h1>
          <p className={styles.muted}>{customer.email}</p>
        </div>
        <Button variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </Stack>

      <section className={styles.section} aria-labelledby="profile-addresses">
        <h2 id="profile-addresses" className={styles.sectionHeading}>
          Addresses
        </h2>
        <AddressBook
          addresses={customer.addresses}
          defaultAddressId={customer.defaultAddress?.id}
          onAdd={(address) => updateCustomer(customer.withAddress(address))}
          onSelectDefault={selectDefault}
        />
      </section>

      <section className={styles.section} aria-labelledby="profile-orders">
        <h2 id="profile-orders" className={styles.sectionHeading}>
          Recent orders
        </h2>
        <RecentOrders customerId={customer.id} client={client} />
      </section>
    </main>
  );
}
