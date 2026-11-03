import Image from 'next/image';
import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Admin sign in | HappiGo' };

export default function AdminSignInPage() {
  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <section className="flex flex-col justify-between bg-brand p-8 text-white md:p-12">
        <Image
          src="/brand/happigo-logo.svg"
          alt="HappiGo"
          width={292}
          height={195}
          className="h-20 w-auto self-start"
          priority
        />
        <p className="mt-16 max-w-md text-4xl font-extrabold leading-tight tracking-tight">
          Keep every order moving.
        </p>
      </section>
      <section className="flex items-center bg-white p-8 md:p-12">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-1 text-3xl font-extrabold">Admin sign in</h1>
          <p className="mb-8 text-muted">Only HappiGo staff can sign in here</p>
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
