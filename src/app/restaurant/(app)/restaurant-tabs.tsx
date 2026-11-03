'use client';

import { BagIcon, ChartBarIcon, ForkKnifeIcon, StorefrontIcon } from '@phosphor-icons/react';
import { TabBar } from '@/components/ui/tab-bar';
import { routes } from '@/lib/routes';

const TABS = [
  { href: routes.restaurant.orders, label: 'Orders', Icon: BagIcon },
  { href: routes.restaurant.menu, label: 'Menu', Icon: ForkKnifeIcon },
  { href: routes.restaurant.earnings, label: 'Earnings', Icon: ChartBarIcon },
  { href: routes.restaurant.store, label: 'Store', Icon: StorefrontIcon },
];

export function RestaurantTabs() {
  return <TabBar tabs={TABS} />;
}
