import { router } from 'expo-router';
import { CaretRight, MapPin, Receipt, SignOut, User } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useRequireAuth } from '@/lib/require-auth';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

function Row({ label, Icon, onPress, danger }: { label: string; Icon: typeof MapPin; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ height: 64, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: danger ? colors.peach : colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} weight="bold" color={danger ? colors.brand : colors.ink} />
      </View>
      <Text weight={danger ? 'semibold' : 'medium'} size={17} color={danger ? colors.brand : colors.ink} style={{ flex: 1 }}>{label}</Text>
      {!danger && <CaretRight size={16} weight="bold" color={colors.muted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, fullName } = useRequireAuth();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 24 }}>
      <Text weight="extrabold" size={28} accessibilityRole="header">Profile</Text>
      <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
          <User size={28} weight="bold" color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="bold" size={20} numberOfLines={1}>{fullName ?? 'Customer'}</Text>
          <Text color={colors.muted} numberOfLines={1}>{session?.user.email}</Text>
        </View>
      </View>
      <View style={{ marginTop: 24 }}>
        <Row label="Saved addresses" Icon={MapPin} onPress={() => router.push('/addresses')} />
        <Row label="My orders" Icon={Receipt} onPress={() => router.navigate('/orders')} />
        <Row
          label="Log out"
          Icon={SignOut}
          danger
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/');
          }}
        />
      </View>
    </View>
  );
}
