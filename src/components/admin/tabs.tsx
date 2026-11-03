import { clsx } from 'clsx';
import Link from 'next/link';

/** Underline tabs that change a search parameter, so the page stays server rendered. */
export function Tabs({
  tabs,
  current,
  href,
}: {
  tabs: readonly { id: string; label: string }[];
  current: string;
  href: (id: string) => string;
}) {
  return (
    <nav aria-label="Filter" className="flex gap-6 border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={href(t.id)}
          aria-current={t.id === current ? 'page' : undefined}
          className={clsx(
            '-mb-px border-b-2 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-brand',
            t.id === current
              ? 'border-brand text-ink'
              : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
