'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { routes } from '@/lib/routes';
import { join, type JoinState } from './actions';

export function JoinForm() {
  const [state, action, pending] = useActionState<JoinState, FormData>(join, {});
  const e = state.errors ?? {};
  if (state.checkEmail) {
    return (
      <div role="status" className="rounded-[22px] border border-line p-5">
        <p className="text-lg font-bold">Check your email</p>
        <p className="text-muted">
          We sent you a link to confirm your account. Then sign in to start earning.
        </p>
        <Link href={routes.driver.signIn} className="mt-4 inline-block font-semibold text-brand">
          Go to sign in
        </Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate>
      <Field
        label="Full name"
        name="fullName"
        autoComplete="name"
        placeholder="Your name"
        error={e.fullName}
      />
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+27 82 000 0000"
        error={e.phone}
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
        {pending ? 'Creating account' : 'Create free account'}
      </Button>
      <p className="mt-6 text-center text-muted">
        Already a driver?{' '}
        <Link href={routes.driver.signIn} className="font-semibold text-brand">
          Sign in
        </Link>
      </p>
    </form>
  );
}
