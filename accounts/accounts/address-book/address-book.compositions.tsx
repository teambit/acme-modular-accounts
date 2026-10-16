import { useState } from 'react';
import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { Customer, mockCustomer } from '@acme-modular/platform.entities.customer';
import { AddressBook } from './address-book.js';

export const SavedAddresses = () => {
  const [customer, setCustomer] = useState(mockCustomer);
  return (
    <AcmeTheme>
      <AddressBook
        addresses={customer.addresses}
        defaultAddressId={customer.defaultAddress?.id}
        onAdd={(address) => setCustomer(customer.withAddress(address))}
        onSelectDefault={(id) => setCustomer(Customer.from({ ...customer.toObject(), defaultAddressId: id }))}
      />
    </AcmeTheme>
  );
};

export const EmptyAddressBook = () => (
  <AcmeTheme>
    <AddressBook addresses={[]} onAdd={(address) => alert(`Saved ${address.label}`)} />
  </AcmeTheme>
);
