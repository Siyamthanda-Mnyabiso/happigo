import Link from 'next/link';
import { BrandHeader } from '@/components/shop/brand-header';
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
    <div className="min-h-dvh md:bg-card">
      <main className="mx-auto min-h-dvh w-full max-w-[430px] bg-white pb-10">
        <BrandHeader />
        <div className="px-6">
          <h1 className="mt-8 text-[30px] font-extrabold leading-tight">Create your account</h1>
          <p className="mb-6 text-muted">No service fee. No hidden charges at checkout.</p>
          <SignUpForm next={next} />
          <p className="mt-8 text-center font-semibold">
            Already have an account?{' '}
            <Link
              href={`${routes.customer.signIn}?next=${encodeURIComponent(next)}`}
              className="text-brand"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
