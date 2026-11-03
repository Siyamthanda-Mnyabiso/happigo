import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Car, Motorcycle, Phone, Hash, Bicycle } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { AuthField } from '@native/auth-field';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { BackButton, Button, Pill, Text } from '@native/ui';
import { useDriver, type DriverProfile } from '@/lib/driver';

const schema = z.object({
  phone: z.string().trim().regex(/^\+?\d[\d\s]{8,14}$/, 'Enter a valid phone number'),
  vehicleType: z.enum(['bike', 'scooter', 'car'], { error: 'Choose a vehicle' }),
  vehicleModel: z.string().trim().max(60),
  vehiclePlate: z.string().trim().max(20),
});

export default function VehicleScreen() {
  const { driver } = useDriver();
  if (!driver) return null;
  return <VehicleForm driver={driver} />;
}

function VehicleForm({ driver }: { driver: DriverProfile }) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid } = useDriver();
  const [v, setV] = useState({ phone: driver.phone ?? '', vehicleType: driver.vehicle_type ?? '', vehicleModel: driver.vehicle_model ?? '', vehiclePlate: driver.vehicle_plate ?? '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save() {
    const parsed = schema.safeParse(v);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from('driver_profiles')
      .update({ phone: parsed.data.phone, vehicle_type: parsed.data.vehicleType, vehicle_model: parsed.data.vehicleModel || null, vehicle_plate: parsed.data.vehiclePlate || null })
      .eq('user_id', uid!);
    setBusy(false);
    if (err) return setError('Could not save. Try again.');
    await qc.invalidateQueries({ queryKey: ['driver', uid] });
    router.back();
  }

  const types = [
    ['bike', 'Bicycle', Bicycle],
    ['scooter', 'Scooter', Motorcycle],
    ['car', 'Car', Car],
  ] as const;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 40 }}>
        <BackButton />
        <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginTop: 16, marginBottom: 20 }}>Vehicle and phone</Text>
        <AuthField label="Phone number" icon={<Phone size={22} color={colors.muted} />} value={v.phone} onChangeText={(t) => setV((s) => ({ ...s, phone: t }))} keyboardType="phone-pad" placeholder="+27 82 000 0000" />
        <Text weight="semibold" style={{ marginBottom: 8 }}>Vehicle</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {types.map(([id, label]) => (
            <Pill key={id} label={label} active={v.vehicleType === id} onPress={() => setV((s) => ({ ...s, vehicleType: id }))} />
          ))}
        </View>
        <AuthField label="Make and model (optional)" icon={<Motorcycle size={22} color={colors.muted} />} value={v.vehicleModel} onChangeText={(t) => setV((s) => ({ ...s, vehicleModel: t }))} autoCapitalize="words" placeholder="Honda Dio" />
        <AuthField label="Number plate (optional)" icon={<Hash size={22} color={colors.muted} />} value={v.vehiclePlate} onChangeText={(t) => setV((s) => ({ ...s, vehiclePlate: t }))} autoCapitalize="characters" placeholder="CA 123 456" />
        {error && <Text accessibilityRole="alert" color={colors.danger} style={{ marginBottom: 12 }}>{error}</Text>}
        <Button label={busy ? 'Saving' : 'Save'} onPress={save} disabled={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
