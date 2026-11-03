import Link from 'next/link';
import { Card, Screen } from '@/components/ui/layout';
import { safeNext } from '@/lib/cart';
import { routes } from '@/lib/routes';
import { SignInForm } from './sign-in-form';

export default async function CustomerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next, routes.customer.home);
  return (
    <Screen>
      <h1 className="mb-1 mt-10 text-3xl font-extrabold">Welcome back</h1>
      <p className="mb-8 text-muted">Sign in to order and track your food.</p>
      <SignInForm next={next} />
      <Card tone="fill" className="mt-10 rounded-[18px] py-4">
        <p className="font-bold">New to HappiGo?</p>
        <p className="text-muted">
          <Link
            href={`${routes.customer.signUp}?next=${encodeURIComponent(next)}`}
            className="font-semibold text-brand"
          >
            Create an account
          </Link>
        </p>
      </Card>
    </Screen>
  );
}
