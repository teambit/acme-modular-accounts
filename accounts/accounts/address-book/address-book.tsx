import { useState } from 'react';
import classNames from 'classnames';
import { Card } from '@acme-modular/design.ui.card';
import { Badge } from '@acme-modular/design.ui.badge';
import { Button } from '@acme-modular/design.ui.button';
import { Modal } from '@acme-modular/design.ui.modal';
import { Stack } from '@acme-modular/design.ui.stack';
import { AddressForm } from '@acme-modular/checkout.checkout.address-form';
import type { Address } from '@acme-modular/platform.entities.customer';
import styles from './address-book.module.css';

export type AddressBookProps = {
  /** the saved addresses to list. */
  addresses: Address[];
  /** the id of the address marked as default. */
  defaultAddressId?: string;
  /** called with a new address from the "Add address" form. */
  onAdd?: (address: Address) => void;
  /** called when another address is made the default. omit to hide the "Make default" buttons. */
  onSelectDefault?: (id: string) => void;
  className?: string;
};

/** formats the city line the US way: "Austin, TX 78701". */
function cityLine(address: Address) {
  return `${address.city}, ${address.region} ${address.postalCode}`;
}

/**
 * The customer's saved addresses as cards, with the default one marked and an
 * "Add address" button that opens the checkout `AddressForm` in a modal.
 */
export function AddressBook({ addresses, defaultAddressId, onAdd, onSelectDefault, className }: AddressBookProps) {
  const [adding, setAdding] = useState(false);

  const handleAdd = (address: Address) => {
    onAdd?.(address);
    setAdding(false);
  };

  return (
    <Stack gap="large" className={classNames(styles.addressBook, className)}>
      {addresses.length === 0 ? (
        <p className={styles.empty}>No saved addresses yet.</p>
      ) : (
        <ul className={styles.list}>
          {addresses.map((address) => {
            const isDefault = address.id === defaultAddressId;
            return (
              <li key={address.id}>
                <Card
                  title={address.label}
                  className={classNames(styles.card, isDefault && styles.default)}
                  footer={
                    isDefault ? (
                      <Badge tone="positive">Default</Badge>
                    ) : (
                      onSelectDefault && (
                        <Button variant="ghost" onClick={() => onSelectDefault(address.id)}>
                          Make default
                        </Button>
                      )
                    )
                  }
                >
                  <address className={styles.address}>
                    {address.name}
                    <br />
                    {address.line1}
                    {address.line2 && (
                      <>
                        <br />
                        {address.line2}
                      </>
                    )}
                    <br />
                    {cityLine(address)}
                    <br />
                    {address.country}
                  </address>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <div>
        <Button variant="secondary" onClick={() => setAdding(true)}>
          Add address
        </Button>
      </div>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add address">
        <AddressForm onSubmit={handleAdd} submitLabel="Save address" />
      </Modal>
    </Stack>
  );
}
