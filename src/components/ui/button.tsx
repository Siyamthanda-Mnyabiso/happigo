import Link from 'next/link';
import { clsx } from 'clsx';

const base =
  'inline-flex h-14 w-full items-center justify-center rounded-full px-6 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60';
const styles = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'border border-line bg-white text-ink hover:bg-card',
};

type Variant = keyof typeof styles;

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={clsx(base, styles[variant], className)} {...props} />;
}

export function LinkButton({
  variant = 'primary',
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={clsx(base, styles[variant], className)} {...props} />;
}
