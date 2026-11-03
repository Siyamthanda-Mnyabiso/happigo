import { Tabs } from 'expo-router';
import { ChartBar, House, User } from 'phosphor-react-native';
import { PillTabBar } from '@native/pill-tab-bar';

const TABS = { index: { Icon: House, label: 'Home' }, earnings: { Icon: ChartBar, label: 'Earnings' }, profile: { Icon: User, label: 'Profile' } };

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <PillTabBar state={p.state} navigateToTab={p.navigateToTab} tabs={TABS} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
