'use client';

import Link from 'next/link';
import { EnvelopeIcon, LockIcon, UserIcon } from '@phosphor-icons/react';
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
        icon={<UserIcon className="size-[22px]" />}
        error={e.fullName}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="name@email.com"
        icon={<EnvelopeIcon className="size-[22px]" />}
        error={e.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        icon={<LockIcon className="size-[22px]" />}
        error={e.password}
      />
      {e.form && (
        <p role="alert" className="mb-4 text-base text-danger">
          {e.form}
        </p>
      )}
      <Button type="submit" disabled={pending} className="shadow-[0_8px_8px_rgba(247,59,3,0.35)]">
        {pending ? 'Creating account' : 'Create account'}
      </Button>
    </form>
  );
}
