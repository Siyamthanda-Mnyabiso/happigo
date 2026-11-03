import { View } from 'react-native';
import { BackButton, Text } from './ui';

/** Back button on the left, title centred. Used on cart and checkout. */
export function PageHeader({ title }: { title: string }) {
  return (
    <View style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: 0 }}>
        <BackButton />
      </View>
      <Text weight="semibold" size={18} accessibilityRole="header">{title}</Text>
    </View>
  );
}
