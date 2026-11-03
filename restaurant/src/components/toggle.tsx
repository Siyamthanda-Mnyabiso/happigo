import { Switch } from 'react-native';
import { colors } from '@native/theme';

export function Toggle({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      trackColor={{ false: '#e4dcd6', true: colors.ok }}
      thumbColor={colors.white}
    />
  );
}
