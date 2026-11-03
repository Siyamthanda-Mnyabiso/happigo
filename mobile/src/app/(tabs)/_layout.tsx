import { Tabs } from 'expo-router';
import { House, MagnifyingGlass, Receipt, User } from 'phosphor-react-native';
import { PillTabBar } from '@native/pill-tab-bar';

const TABS = { index: { Icon: House, label: 'Home' }, search: { Icon: MagnifyingGlass, label: 'Search' }, orders: { Icon: Receipt, label: 'Orders' }, profile: { Icon: User, label: 'Profile' } };

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <PillTabBar state={p.state} navigateToTab={p.navigateToTab} tabs={TABS} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
