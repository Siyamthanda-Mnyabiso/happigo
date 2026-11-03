'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { routes } from '@/lib/routes';
import type { AuthState } from '../sign-in/actions';
import { signUp } from './actions';

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  const e = state.errors ?? {};
  if (state.checkEmail) {
    return (
      <div role="status" className="rounded-[22px] border border-line p-5">
        <p className="text-lg font-bold">Check your email</p>
        <p className="text-muted">
          We sent you a link to confirm your account. Then sign in to order.
        </p>
        <Link
          href={`${routes.customer.signIn}?next=${encodeURIComponent(next)}`}
          className="mt-4 inline-block font-semibold text-brand"
        >
          Go to sign in
        </Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next} />
      <Field
        label="Your name"
        name="fullName"
        autoComplete="name"
        placeholder="Your name"
        error={e.fullName}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        error={e.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={e.password}
      />
      {e.form && (
        <p role="alert" className="mb-4 text-base text-danger">
          {e.form}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating account' : 'Create account'}
      </Button>
    </form>
  );
}
