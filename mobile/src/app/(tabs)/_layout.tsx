import { Tabs } from 'expo-router';
import { House, MagnifyingGlass, Receipt, User } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '@/theme';

const ICONS = { index: House, search: MagnifyingGlass, orders: Receipt, profile: User } as const;
const LABELS = { index: 'Home', search: 'Search', orders: 'Orders', profile: 'Profile' } as const;

/** The dark floating pill from the design, with an orange circle behind the active icon. */
function PillTabBar({ state, navigateToTab }: { state: { index: number; routes: { key: string; name: string }[] }; navigateToTab: (routeKey: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, shadow.nav, { bottom: Math.max(insets.bottom, 16) }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const name = route.name as keyof typeof ICONS;
        const Icon = ICONS[name];
        if (!Icon) return null;
        const active = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={LABELS[name]}
            accessibilityState={{ selected: active }}
            onPress={() => navigateToTab(route.key)}
            style={[styles.tab, active && { backgroundColor: colors.brand }]}
          >
            <Icon size={24} weight="bold" color={active ? colors.white : colors.navIcon} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <PillTabBar state={p.state} navigateToTab={p.navigateToTab} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tab: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
