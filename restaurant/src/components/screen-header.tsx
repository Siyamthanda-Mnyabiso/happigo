import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Text } from '@native/ui';

/** Back button and centred title, as on the detail screens. */
export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <BackButton />
      <Text weight="semibold" size={18} accessibilityRole="header" style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', top: insets.top + 24 }}>{title}</Text>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
