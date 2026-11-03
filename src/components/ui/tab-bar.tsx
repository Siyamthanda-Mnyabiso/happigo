'use client';

import type { Icon } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type Tab = { href: string; label: string; Icon: Icon };

/** Floating dark pill with one icon per section. Shared by the restaurant and driver apps. */
export function TabBar({ tabs }: { tabs: readonly Tab[] }) {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-4 mx-auto flex h-[68px] w-[calc(100%-32px)] max-w-[398px] items-center justify-around rounded-full bg-ink px-3"
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = path === href || (href !== '/' && path.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex size-12 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-white',
              active ? 'bg-brand text-white' : 'text-nav-icon',
            )}
          >
            <Icon weight="bold" className="size-6" aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}
