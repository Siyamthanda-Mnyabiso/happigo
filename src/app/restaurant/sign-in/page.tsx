import { Screen } from '@/components/ui/layout';
import { SignInForm } from './sign-in-form';

export default function SignInPage() {
  return (
    <Screen>
      <p className="mt-10 text-base font-semibold text-brand">Restaurant partner</p>
      <h1 className="mb-1 text-3xl font-extrabold">Partner sign in</h1>
      <p className="mb-8 text-muted">Manage orders, menu and earnings.</p>
      <SignInForm />
      <p className="mt-8 text-center text-muted">
        New partner? <span className="font-semibold text-brand">Join on a flat monthly plan</span>
      </p>
    </Screen>
  );
}
