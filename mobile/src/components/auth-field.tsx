import { View, TextInput, type TextInputProps } from 'react-native';
import { colors } from '@/theme';
import { Text } from './ui';

/** A labelled input with a leading icon, from the sign in design. */
export function AuthField({ label, icon, error, ...props }: TextInputProps & { label: string; icon: React.ReactNode; error?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text weight="semibold" style={{ marginBottom: 8 }}>{label}</Text>
      <View style={{ height: 54, borderRadius: 16, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
        {icon}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.mutedLight}
          autoCapitalize="none"
          style={{ flex: 1, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.ink, height: 54 }}
          {...props}
        />
      </View>
      {error ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
