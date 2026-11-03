'use client';

import {
  ChartBarIcon,
  ForkKnifeIcon,
  MotorcycleIcon,
  ReceiptIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import { clsx } from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/lib/routes';
import { signOut } from '@/app/admin/(app)/actions';

const links = [
  { href: routes.admin.overview, label: 'Overview', Icon: ChartBarIcon },
  { href: routes.admin.restaurants, label: 'Restaurants', Icon: ForkKnifeIcon },
  { href: routes.admin.drivers, label: 'Drivers', Icon: MotorcycleIcon },
  { href: routes.admin.orders, label: 'Orders', Icon: ReceiptIcon },
  { href: routes.admin.customers, label: 'Customers', Icon: UsersIcon },
] as const;

export function Sidebar({ email }: { email: string }) {
  const path = usePathname();
  return (
    <aside className="flex w-full shrink-0 flex-col bg-ink px-4 py-6 md:sticky md:top-0 md:h-dvh md:w-64">
      <Image
        src="/brand/happigo-logo.svg"
        alt="HappiGo admin"
        width={292}
        height={195}
        className="mb-6 h-14 w-auto self-start rounded-lg"
        priority
      />
      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col">
        {links.map(({ href, label, Icon }) => {
          const active = href === routes.admin.overview ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex h-12 shrink-0 items-center gap-3 rounded-xl px-4 font-semibold focus-visible:outline-2 focus-visible:outline-white',
                active ? 'bg-brand text-white' : 'text-on-dark hover:bg-ink-soft',
              )}
            >
              <Icon weight="bold" className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t border-ink-soft pt-4 md:mt-auto">
        <p className="mb-2 truncate px-4 text-on-dark">{email}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="h-12 w-full rounded-xl px-4 text-left font-semibold text-on-dark hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
