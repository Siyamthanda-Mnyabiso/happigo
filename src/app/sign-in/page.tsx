import Link from 'next/link';
import { BrandHeader } from '@/components/shop/brand-header';
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
    <div className="min-h-dvh md:bg-card">
      <main className="mx-auto min-h-dvh w-full max-w-[430px] bg-white pb-10">
        <BrandHeader />
        <div className="px-6">
          <h1 className="mt-8 text-[30px] font-extrabold leading-tight">Welcome back</h1>
          <p className="mb-6 text-muted">Sign in to order your next meal.</p>
          <SignInForm next={next} />
          <p className="mt-8 text-center font-semibold">
            New here?{' '}
            <Link
              href={`${routes.customer.signUp}?next=${encodeURIComponent(next)}`}
              className="text-brand"
            >
              Create account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
