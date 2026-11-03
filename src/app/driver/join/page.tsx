import { CheckIcon } from '@phosphor-icons/react/dist/ssr';
import { Card, Screen } from '@/components/ui/layout';
import { JoinForm } from './join-form';

export default function JoinPage() {
  return (
    <Screen>
      <p className="mt-6 text-base font-semibold text-brand">Free to join</p>
      <h1 className="mb-1 text-3xl font-extrabold">Join as a driver</h1>
      <p className="mb-6 text-muted">Create your account in minutes.</p>
      <JoinForm />
      <Card tone="fill" className="mt-8 rounded-[18px] py-4">
        <p className="mb-1 font-bold">Joining is free</p>
        <ul className="space-y-1 text-muted">
          {['No sign up fee', 'No monthly fee', 'You keep the delivery fee and tips'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckIcon weight="bold" className="size-5 text-brand" aria-hidden /> {t}
            </li>
          ))}
        </ul>
      </Card>
    </Screen>
  );
}
