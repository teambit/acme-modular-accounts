import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import classNames from 'classnames';
import { TextInput } from '@acme-modular/design.ui.text-input';
import { Button } from '@acme-modular/design.ui.button';
import { Alert } from '@acme-modular/design.ui.alert';
import { useSession } from '@acme-modular/accounts.accounts.use-session';
import type { Customer } from '@acme-modular/platform.entities.customer';
import styles from './login-form.module.css';

export type LoginFormProps = {
  /** called once this form's sign-in succeeds. */
  onSignedIn?: (customer: Customer) => void;
  className?: string;
};

type FieldErrors = { email?: string; password?: string };

/**
 * An email and password sign-in form over `useSession`. Shows field errors for
 * empty inputs and an alert when the credentials are rejected. Must be used
 * inside a `SessionProvider`.
 */
export function LoginForm({ onSignedIn, className }: LoginFormProps) {
  const { signIn, status, error, customer } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // only report sign-ins started from this form, not a session that was already signed in.
  const awaiting = useRef(false);
  const signingIn = status === 'signing-in';

  useEffect(() => {
    if (!awaiting.current) return;
    if (status === 'signed-out') awaiting.current = false;
    if (status === 'signed-in' && customer) {
      awaiting.current = false;
      onSignedIn?.(customer);
    }
  }, [status, customer, onSignedIn]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: FieldErrors = {
      email: email.trim() ? undefined : 'Enter your email.',
      password: password ? undefined : 'Enter your password.',
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    awaiting.current = true;
    void signIn(email.trim(), password);
  };

  return (
    <form className={classNames(styles.loginForm, className)} onSubmit={handleSubmit} noValidate aria-label="Sign in">
      {error && (
        <Alert tone="negative" title="Couldn't sign you in">
          {error.message}
        </Alert>
      )}
      <TextInput
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={setEmail}
        error={fieldErrors.email}
      />
      <TextInput
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={setPassword}
        error={fieldErrors.password}
      />
      <Button type="submit" fullWidth disabled={signingIn}>
        {signingIn ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
