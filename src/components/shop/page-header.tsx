import { BackButton } from './back-button';

/** Back button on the left, title centred. Used on cart and checkout. */
export function PageHeader({ title, back }: { title: string; back: string }) {
  return (
    <header className="relative flex h-11 items-center justify-center">
      <BackButton href={back} className="absolute left-0" />
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
