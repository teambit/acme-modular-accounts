import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockCustomer } from '@acme-modular/platform.entities.customer';
import { AddressBook } from './address-book.js';

const customer = mockCustomer();

it('lists every address and marks the default one', () => {
  render(<AddressBook addresses={customer.addresses} defaultAddressId="a-office" />);
  expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Office' })).toBeTruthy();
  expect(screen.getAllByText('Default')).toHaveLength(1);
  expect(screen.getByText('500 Congress Ave', { exact: false })).toBeTruthy();
});

it('makes another address the default', () => {
  const onSelectDefault = vi.fn();
  render(<AddressBook addresses={customer.addresses} defaultAddressId="a-office" onSelectDefault={onSelectDefault} />);
  fireEvent.click(screen.getByRole('button', { name: 'Make default' }));
  expect(onSelectDefault).toHaveBeenCalledWith('a-home');
});

it('opens the address form in a modal', () => {
  render(<AddressBook addresses={[]} onAdd={vi.fn()} />);
  expect(screen.getByText('No saved addresses yet.')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Add address' }));
  expect(screen.getByRole('dialog', { name: 'Add address' })).toBeTruthy();
});
