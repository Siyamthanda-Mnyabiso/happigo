import { ArrowLeft } from 'phosphor-react-native';
import { router } from 'expo-router';
import { Pressable, Text as RNText, type TextProps, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, shadow } from '@/theme';

const FAMILY = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  extrabold: 'Figtree_800ExtraBold',
} as const;

/** Text with the right Figtree file for each weight. React Native can't pick a weight from one family. */
export function Text({
  weight = 'regular',
  size = 16,
  color = colors.ink,
  style,
  ...props
}: TextProps & { weight?: keyof typeof FAMILY; size?: number; color?: string }) {
  return <RNText {...props} style={[{ fontFamily: FAMILY[weight], fontSize: size, color }, style]} />;
}

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? [{ backgroundColor: pressed ? colors.brandHover : colors.brand }, shadow.brand] : styles.outline,
        disabled && { opacity: 0.6 },
        style,
      ]}
    >
      <Text weight="semibold" color={primary ? colors.white : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

/** The round white back button from the design. */
export function BackButton({ onPress, label = 'Back' }: { onPress?: () => void; label?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={[styles.back, shadow.soft]}
    >
      <ArrowLeft size={20} weight="bold" color={colors.ink} />
    </Pressable>
  );
}

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[styles.pill, active ? { backgroundColor: colors.brand, borderColor: colors.brand } : { borderColor: colors.line }]}
    >
      <Text weight="semibold" color={active ? colors.white : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

export const Spacer = ({ h }: { h: number }) => <View style={{ height: h }} />;

const styles = StyleSheet.create({
  button: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  outline: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 44, borderRadius: 22, paddingHorizontal: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
