import { router } from 'expo-router';
import { CaretRight, Motorcycle, SignOut, User } from 'phosphor-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Text } from '@native/ui';
import { useDriver } from '@/lib/driver';

export const VEHICLES = { bike: 'Bicycle', scooter: 'Scooter', car: 'Car' } as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { driver, name, email } = useDriver();
  const vehicle = driver?.vehicle_type ? VEHICLES[driver.vehicle_type as keyof typeof VEHICLES] ?? driver.vehicle_type : null;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 130 }}>
      <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginBottom: 20 }}>Profile</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
          <User size={32} color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="bold" size={20}>{name}</Text>
          {email ? <Text color={colors.muted}>{email}</Text> : null}
          {driver?.phone ? <Text color={colors.muted}>{driver.phone}</Text> : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit vehicle and phone"
        onPress={() => router.push('/vehicle')}
        style={{ backgroundColor: colors.ink, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}
      >
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Motorcycle size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="bold" color={colors.white}>{driver?.vehicle_model || (vehicle ? vehicle : 'Add your vehicle')}</Text>
          <Text color={colors.onDark}>{[driver?.vehicle_plate, vehicle].filter(Boolean).join(' · ') || 'Tap to add details'}</Text>
        </View>
        <CaretRight size={20} color={colors.onDark} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/sign-in');
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
          <SignOut size={20} color={colors.brand} />
        </View>
        <Text weight="semibold" color={colors.brand}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}
