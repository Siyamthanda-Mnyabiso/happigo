import Link from 'next/link';
import { Screen } from '@/components/ui/layout';
import { safeNext } from '@/lib/cart';
import { routes } from '@/lib/routes';
import { SignUpForm } from './sign-up-form';

export default async function CustomerSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next, routes.customer.home);
  return (
    <Screen>
      <h1 className="mb-1 mt-10 text-3xl font-extrabold">Create your account</h1>
      <p className="mb-8 text-muted">No fees. No hidden charges at checkout.</p>
      <SignUpForm next={next} />
      <p className="mt-8 text-center text-muted">
        Already have an account?{' '}
        <Link
          href={`${routes.customer.signIn}?next=${encodeURIComponent(next)}`}
          className="font-semibold text-brand"
        >
          Sign in
        </Link>
      </p>
    </Screen>
  );
}
