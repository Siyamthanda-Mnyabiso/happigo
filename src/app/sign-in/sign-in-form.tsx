'use client';

import { LockIcon, UserIcon } from '@phosphor-icons/react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { signIn, type AuthState } from './actions';

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="name@email.com"
        icon={<UserIcon className="size-[22px]" />}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        icon={<LockIcon className="size-[22px]" />}
        error={e.password}
      />
      {e.form && (
        <p role="alert" className="mb-4 text-base text-danger">
          {e.form}
        </p>
      )}
      <Button type="submit" disabled={pending} className="shadow-[0_8px_8px_rgba(247,59,3,0.35)]">
        {pending ? 'Signing in' : 'Sign in'}
      </Button>
    </form>
  );
}
