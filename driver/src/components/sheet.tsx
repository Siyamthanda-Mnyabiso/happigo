import { View, type ViewStyle } from 'react-native';
import { colors } from '@native/theme';

/** The white bottom panel from the design. Sits above the floating tab bar when `tabs` is set. */
export function Sheet({ children, tabs, style }: { children: React.ReactNode; tabs?: boolean; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.white,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: tabs ? 112 : 32,
          shadowColor: '#1a0d00',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
        style,
      ]}
    >
      <View style={{ alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 16 }} />
      {children}
    </View>
  );
}

/** Stand-in for the map in the design: a plain field with soft rings, no invented streets or routes. */
export function Backdrop({ children, rings }: { children?: React.ReactNode; rings?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
      {rings && (
        <View style={{ position: 'absolute', top: 190, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: '#ffd5c4' }} />
        </View>
      )}
      {children}
    </View>
  );
}
