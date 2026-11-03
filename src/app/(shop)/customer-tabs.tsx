'use client';

import { HouseIcon, MagnifyingGlassIcon, ReceiptIcon, UserIcon } from '@phosphor-icons/react';
import { TabBar } from '@/components/ui/tab-bar';
import { routes } from '@/lib/routes';

const TABS = [
  { href: routes.customer.home, label: 'Home', Icon: HouseIcon },
  { href: routes.customer.search, label: 'Search', Icon: MagnifyingGlassIcon },
  { href: routes.customer.orders, label: 'Orders', Icon: ReceiptIcon },
  { href: routes.customer.account, label: 'Profile', Icon: UserIcon },
];

export function CustomerTabs() {
  return <TabBar tabs={TABS} />;
}
