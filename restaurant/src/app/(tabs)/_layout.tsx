import { Tabs } from 'expo-router';
import { ChartBar, ForkKnife, Receipt, Storefront } from 'phosphor-react-native';
import { PillTabBar } from '@native/pill-tab-bar';

const TABS = {
  index: { Icon: Receipt, label: 'Orders' },
  menu: { Icon: ForkKnife, label: 'Menu' },
  earnings: { Icon: ChartBar, label: 'Earnings' },
  store: { Icon: Storefront, label: 'Store' },
};

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <PillTabBar state={p.state} navigateToTab={p.navigateToTab} tabs={TABS} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="store" />
    </Tabs>
  );
}
