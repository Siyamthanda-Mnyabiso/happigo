import { clsx } from 'clsx';

/** A full-height mobile column. Used by pages outside the tab bar shell. */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-8 pt-6">
      {children}
    </main>
  );
}

/** Outlined container. `selected` is the orange outlined state used by plan cards. */
export function Card({
  tone = 'outline',
  className,
  ...props
}: React.ComponentProps<'div'> & { tone?: 'outline' | 'fill' | 'dark' }) {
  return (
    <div
      className={clsx(
        'rounded-[22px] p-5',
        tone === 'outline' && 'border border-line',
        tone === 'fill' && 'bg-card',
        tone === 'dark' && 'rounded-3xl bg-ink p-6 text-white',
        className,
      )}
      {...props}
    />
  );
}
