import type { Icon } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from './theme';

type Props = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigateToTab: (routeKey: string) => void;
  /** Route name to its icon and screen reader label. Routes not listed here are hidden. */
  tabs: Record<string, { Icon: Icon; label: string }>;
};

/** The dark floating pill from the designs, with an orange circle behind the active icon. */
export function PillTabBar({ state, navigateToTab, tabs }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, shadow.nav, { bottom: Math.max(insets.bottom, 16) }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const tab = tabs[route.name];
        if (!tab) return null;
        const active = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => navigateToTab(route.key)}
            style={[styles.tab, active && { backgroundColor: colors.brand }]}
          >
            <tab.Icon size={24} weight="bold" color={active ? colors.white : colors.navIcon} />
          </Pressable>
        );
      })}
    </View>
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
  tab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
