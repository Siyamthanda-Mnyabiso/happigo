import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

/** The round white back button from the design. Shadow keeps it readable over photos. */
export function BackButton({
  href,
  label = 'Back',
  className = '',
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex size-11 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(26,13,0,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
    >
      <ArrowLeftIcon weight="bold" className="size-5" aria-hidden />
    </Link>
  );
}
