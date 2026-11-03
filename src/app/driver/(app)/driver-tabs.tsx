'use client';

import { ChartBarIcon, HouseIcon, UserIcon } from '@phosphor-icons/react';
import { TabBar } from '@/components/ui/tab-bar';
import { routes } from '@/lib/routes';

const TABS = [
  { href: routes.driver.home, label: 'Home', Icon: HouseIcon },
  { href: routes.driver.earnings, label: 'Earnings', Icon: ChartBarIcon },
  { href: routes.driver.profile, label: 'Profile', Icon: UserIcon },
];

export function DriverTabs() {
  return <TabBar tabs={TABS} />;
}
