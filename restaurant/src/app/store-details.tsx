import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseRand, toRandInput } from '@core/money';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Button, Text } from '@native/ui';
import { PhotoField } from '@/components/photo-field';
import { ScreenHeader } from '@/components/screen-header';
import { usePartner, type Partner } from '@/lib/partner';
import { uploadPhoto, type Picked } from '@/lib/photo';

function Field({ label, error, ...props }: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text weight="semibold" style={{ marginBottom: 8 }}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.mutedLight} style={{ height: 54, borderRadius: 16, backgroundColor: colors.card, paddingHorizontal: 16, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.ink }} {...props} />
      {error ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export default function StoreDetails() {
  const { partner, ready } = usePartner();
  if (!ready || !partner) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  return <Form partner={partner} />;
}

function Form({ partner }: { partner: Partner }) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid } = usePartner();
  const { restaurant, branch } = partner;
  const [v, setV] = useState({ name: restaurant.name === 'New restaurant' ? '' : restaurant.name, cuisine: restaurant.cuisine ?? '', address: branch?.address ?? '', fee: toRandInput(restaurant.delivery_fee_cents) });
  const [photo, setPhoto] = useState<Picked | null>(null);
  const [errors, setErrors] = useState<Partial<Record<'name' | 'address' | 'fee' | 'form', string>>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    const e: typeof errors = {};
    const fee = parseRand(v.fee);
    if (v.name.trim().length < 2) e.name = 'Enter your restaurant name';
    if (v.address.trim().length < 5) e.address = 'Enter the street address customers collect from';
    if (fee === null) e.fee = 'Enter a fee like 15 or 0';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    let url: string | undefined;
    if (photo) {
      const up = await uploadPhoto(restaurant.id, photo);
      if ('error' in up) { setBusy(false); return setErrors({ form: up.error }); }
      url = up.url;
    }
    const r = await supabase.from('restaurants').update({ name: v.name.trim(), cuisine: v.cuisine.trim() || null, delivery_fee_cents: fee!, ...(url && { image_url: url }) }).eq('id', restaurant.id);
    const b = r.error ? r : branch
      ? await supabase.from('branches').update({ address: v.address.trim() }).eq('id', branch.id)
      : await supabase.from('branches').insert({ restaurant_id: restaurant.id, name: 'Main', address: v.address.trim(), accepting_orders: false });
    setBusy(false);
    if (b.error) return setErrors({ form: 'Could not save. Try again.' });
    await qc.invalidateQueries({ queryKey: ['partner', uid] });
    router.back();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScreenHeader title="Store details" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}>
        {!branch && <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16 }}><Text weight="bold">Finish setting up your store</Text><Text color={colors.muted}>Add your address and save. Customers can find you once you do.</Text></View>}
        <PhotoField currentUrl={restaurant.image_url} onPick={setPhoto} height={150} />
        <Field label="Restaurant name" value={v.name} onChangeText={(t) => setV((s) => ({ ...s, name: t }))} autoCapitalize="words" error={errors.name} />
        <Field label="Cuisine" value={v.cuisine} onChangeText={(t) => setV((s) => ({ ...s, cuisine: t }))} placeholder="Burgers" autoCapitalize="words" />
        <Field label="Street address" value={v.address} onChangeText={(t) => setV((s) => ({ ...s, address: t }))} error={errors.address} />
        <Field label="Delivery fee in rand" value={v.fee} onChangeText={(t) => setV((s) => ({ ...s, fee: t }))} keyboardType="decimal-pad" error={errors.fee} />
        {errors.form ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginBottom: 12 }}>{errors.form}</Text> : null}
        <Button label={busy ? 'Saving' : 'Save'} onPress={save} disabled={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
