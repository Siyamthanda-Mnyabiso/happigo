import Link from 'next/link';
import { Card, Screen } from '@/components/ui/layout';
import { routes } from '@/lib/routes';
import { SignInForm } from './sign-in-form';

export default function DriverSignInPage() {
  return (
    <Screen>
      <p className="mt-10 text-base font-semibold text-brand">Driver app</p>
      <h1 className="mb-1 text-3xl font-extrabold">Driver sign in</h1>
      <p className="mb-8 text-muted">Sign in to start earning with HappiGo.</p>
      <SignInForm />
      <Card tone="fill" className="mt-10 rounded-[18px] py-4">
        <p className="font-bold">Want to deliver with us?</p>
        <p className="text-muted">
          Free to join.{' '}
          <Link href={routes.driver.join} className="font-semibold text-brand">
            Sign up in minutes
          </Link>
        </p>
      </Card>
    </Screen>
  );
}
