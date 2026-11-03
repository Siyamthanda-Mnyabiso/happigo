import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORY_SUGGESTIONS } from '@core/menu';
import { parseRand, toRandInput } from '@core/money';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Button, Pill, Text } from '@native/ui';
import { PhotoField } from '@/components/photo-field';
import { ScreenHeader } from '@/components/screen-header';
import { Toggle } from '@/components/toggle';
import { usePartner } from '@/lib/partner';
import { uploadPhoto, type Picked } from '@/lib/photo';

type Item = { name: string; price_cents: number; category: string; description: string | null; available: boolean; popular: boolean; image_url: string | null };
const BLANK: Item = { name: '', price_cents: 0, category: 'Burgers', description: '', available: true, popular: false, image_url: null };

function Field({ label, error, ...props }: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text weight="semibold" style={{ marginBottom: 8 }}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.mutedLight} style={[{ minHeight: 54, borderRadius: 16, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.ink }, props.multiline && { minHeight: 96, textAlignVertical: 'top' }]} {...props} />
      {error ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { partner, ready } = usePartner();
  const isNew = id === 'new';
  const q = useQuery({
    queryKey: ['menu-item', id],
    enabled: ready && !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from('menu_items').select('name, price_cents, category, description, available, popular, image_url').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as Item | null;
    },
  });
  if (!ready || !partner || (!isNew && q.isLoading)) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  if (!isNew && !q.data) return <View style={{ flex: 1 }}><ScreenHeader title="Edit item" /><Text style={{ padding: 24 }} color={colors.muted}>Item not found.</Text></View>;
  return <ItemForm id={isNew ? null : id} item={q.data ?? BLANK} restaurantId={partner.restaurant.id} branchId={partner.branch?.id ?? null} />;
}

function ItemForm({ id, item, restaurantId, branchId }: { id: string | null; item: Item; restaurantId: string; branchId: string | null }) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [v, setV] = useState({ name: item.name, price: item.price_cents ? toRandInput(item.price_cents) : '', category: item.category, description: item.description ?? '', available: item.available, popular: item.popular });
  const [photo, setPhoto] = useState<Picked | null>(null);
  const [errors, setErrors] = useState<Partial<Record<'name' | 'price' | 'category' | 'form', string>>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    const e: typeof errors = {};
    const cents = parseRand(v.price);
    if (v.name.trim().length < 2) e.name = 'Enter the item name';
    if (cents === null || cents === 0) e.price = 'Enter a price like 65 or 65.50';
    if (!v.category.trim()) e.category = 'Choose or type a category';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!branchId) return setErrors({ form: 'Add your store address first.' });
    setBusy(true);
    let url: string | undefined;
    if (photo) {
      const up = await uploadPhoto(restaurantId, photo);
      if ('error' in up) { setBusy(false); return setErrors({ form: up.error }); }
      url = up.url;
    }
    const row = { name: v.name.trim(), price_cents: cents!, category: v.category.trim(), description: v.description.trim() || null, available: v.available, popular: v.popular, ...(url && { image_url: url }) };
    const { error } = id ? await supabase.from('menu_items').update(row).eq('id', id) : await supabase.from('menu_items').insert({ ...row, branch_id: branchId });
    setBusy(false);
    if (error) return setErrors({ form: 'Could not save. Try again.' });
    await qc.invalidateQueries({ queryKey: ['menu', branchId] });
    qc.removeQueries({ queryKey: ['menu-item', id] });
    router.back();
  }

  async function remove() {
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    const { error } = await supabase.from('menu_items').delete().eq('id', id!);
    setBusy(false);
    if (error) return setErrors({ form: 'Could not delete. Try again.' });
    await qc.invalidateQueries({ queryKey: ['menu', branchId] });
    router.back();
  }

  const row = (title: string, sub: string, key: 'available' | 'popular') => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
      <View style={{ flex: 1 }}><Text weight="bold">{title}</Text><Text color={colors.muted}>{sub}</Text></View>
      <Toggle value={v[key]} onChange={(x) => setV((s) => ({ ...s, [key]: x }))} label={title} />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScreenHeader title={id ? 'Edit item' : 'Add item'} right={<Text weight="bold" color={busy ? colors.muted : colors.brand} onPress={busy ? undefined : save} accessibilityRole="button">Save</Text>} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}>
        <PhotoField currentUrl={item.image_url} onPick={setPhoto} />
        <Field label="Item name" value={v.name} onChangeText={(t) => setV((s) => ({ ...s, name: t }))} error={errors.name} autoCapitalize="words" />
        <Field label="Price in rand" value={v.price} onChangeText={(t) => setV((s) => ({ ...s, price: t }))} keyboardType="decimal-pad" placeholder="65" error={errors.price} />
        <Text weight="semibold" style={{ marginBottom: 8 }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {CATEGORY_SUGGESTIONS.map((c) => <Pill key={c} label={c} active={v.category === c} onPress={() => setV((s) => ({ ...s, category: c }))} />)}
        </View>
        <Field label="Or type your own" value={v.category} onChangeText={(t) => setV((s) => ({ ...s, category: t }))} error={errors.category} />
        <Field label="Description" value={v.description} onChangeText={(t) => setV((s) => ({ ...s, description: t }))} multiline />
        {row('Available now', 'Customers can order this item', 'available')}
        {row('Mark as popular', 'Shown first on your menu', 'popular')}
        {errors.form ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginVertical: 8 }}>{errors.form}</Text> : null}
        <View style={{ marginTop: 16 }}><Button label={busy ? 'Saving' : 'Save item'} onPress={save} disabled={busy} /></View>
        {id ? <Text accessibilityRole="button" weight="semibold" color={colors.danger} onPress={remove} style={{ textAlign: 'center', marginTop: 20, padding: 8 }}>{confirmDelete ? 'Tap again to delete this item' : 'Delete item'}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
