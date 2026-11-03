import { router } from 'expo-router';
import { Plus, MagnifyingGlass } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupByCategory } from '@core/menu';
import { formatRand } from '@core/money';
import { supabase } from '@native/supabase';
import { colors, shadow } from '@native/theme';
import { Pill, Text } from '@native/ui';
import { FoodImage } from '@/components/food-image';
import { Toggle } from '@/components/toggle';
import { usePartner } from '@/lib/partner';

type Item = { id: string; name: string; price_cents: number; category: string; available: boolean; popular: boolean; description: string | null; image_url: string | null };

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { partner, ready } = usePartner({ onboarded: true });
  const branchId = partner?.branch?.id;
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['menu', branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price_cents, category, available, popular, description, image_url')
        .eq('branch_id', branchId!)
        .order('name');
      if (error) throw error;
      return data as Item[];
    },
  });

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = (q.data ?? []).filter((i) => !term || i.name.toLowerCase().includes(term));
    return groupByCategory(items);
  }, [q.data, search]);

  if (!ready || !partner) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;

  async function setAvailable(i: Item, v: boolean) {
    // Show the change straight away, then make it true on the server.
    qc.setQueryData<Item[]>(['menu', branchId], (old) => old?.map((x) => (x.id === i.id ? { ...x, available: v } : x)));
    const { error } = await supabase.from('menu_items').update({ available: v }).eq('id', i.id);
    if (error) qc.invalidateQueries({ queryKey: ['menu', branchId] });
  }

  const cats = groups.map((g) => g.category);
  const shown = cat ? groups.filter((g) => g.category === cat) : groups;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 130 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text weight="extrabold" size={30} accessibilityRole="header">Menu</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Add item" onPress={() => router.push({ pathname: '/item/[id]', params: { id: 'new' } })} style={[{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, shadow.brand]}>
          <Plus size={24} weight="bold" color={colors.white} />
        </Pressable>
      </View>
      {!partner.branch ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20 }}>
          <Text weight="bold">Set up your store first</Text>
          <Text color={colors.muted} style={{ marginBottom: 12 }}>Add your address so customers know where you are.</Text>
          <Pill label="Go to store details" onPress={() => router.push('/store-details')} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, borderRadius: 26, backgroundColor: colors.card, paddingHorizontal: 16, marginBottom: 16 }}>
            <MagnifyingGlass size={22} color={colors.muted} />
            <TextInput accessibilityLabel="Search menu items" placeholder="Search menu items" placeholderTextColor={colors.mutedLight} value={search} onChangeText={setSearch} style={{ flex: 1, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.ink, height: 52 }} />
          </View>
          {cats.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              <Pill label="All" active={!cat} onPress={() => setCat(null)} />
              {cats.map((c) => <Pill key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
            </ScrollView>
          )}
          {q.isLoading ? <ActivityIndicator color={colors.brand} /> : !shown.length ? (
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20 }}><Text color={colors.muted}>{search ? 'No items match.' : 'No items yet. Add your first one and customers can start ordering.'}</Text></View>
          ) : shown.map((g) => (
            <View key={g.category} style={{ marginBottom: 8 }}>
              {!cat && <Text weight="bold" size={18} style={{ marginTop: 8, marginBottom: 4 }}>{g.category}</Text>}
              {g.items.map((i) => (
                <View key={`${g.category}-${i.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${i.name}`} onPress={() => router.push({ pathname: '/item/[id]', params: { id: i.id } })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden' }}><FoodImage uri={i.image_url} hint={i.category} seed={i.id} emojiSize={28} /></View>
                    <View style={{ flex: 1 }}>
                      <Text weight="bold">{i.name}</Text>
                      <Text weight="bold" color={colors.brand}>{formatRand(i.price_cents)}</Text>
                      {i.description ? <Text color={colors.muted} numberOfLines={1}>{i.description}</Text> : null}
                    </View>
                  </Pressable>
                  <View style={{ alignItems: 'center' }}>
                    <Toggle value={i.available} onChange={(v) => setAvailable(i, v)} label={`${i.name} available`} />
                    {!i.available && <Text color={colors.muted} size={14}>Sold out</Text>}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
