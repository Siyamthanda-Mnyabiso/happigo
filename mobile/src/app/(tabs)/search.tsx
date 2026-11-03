import { useLocalSearchParams, router } from 'expo-router';
import { MagnifyingGlass, X } from 'phosphor-react-native';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RestaurantCard } from '@/components/restaurant-card';
import { BackButton, Pill, Text } from '@native/ui';
import { useRestaurants } from '@/lib/data';
import { HOME_CUISINES } from '@core/food';
import { colors } from '@native/theme';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; cuisine?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  const cuisine = HOME_CUISINES.find((c) => c.name === params.cuisine)?.name;
  const { data, isLoading } = useRestaurants();

  const needle = q.trim().toLowerCase();
  const shown = (data ?? []).filter(
    (r) =>
      (!cuisine || r.cuisine?.toLowerCase().includes(cuisine.toLowerCase())) &&
      (!needle || r.name.toLowerCase().includes(needle) || r.cuisine?.toLowerCase().includes(needle)),
  );
  const setCuisine = (c?: string) => router.setParams({ cuisine: c });

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton onPress={() => router.navigate('/')} />
        <View style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <MagnifyingGlass size={20} color={colors.muted} />
          <TextInput
            accessibilityLabel="Search restaurants or dishes"
            value={q}
            onChangeText={setQ}
            placeholder="Search restaurants or dishes"
            placeholderTextColor={colors.mutedLight}
            returnKeyType="search"
            style={{ flex: 1, marginLeft: 10, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.ink, height: 48 }}
          />
          {q.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQ('')} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} weight="bold" color={colors.ink} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ height: 60 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, alignItems: 'center' }}>
          <Pill label="All" active={!cuisine} onPress={() => setCuisine(undefined)} />
          {HOME_CUISINES.map((c) => (
            <Pill key={c.name} label={c.name} active={c.name === cuisine} onPress={() => setCuisine(c.name)} />
          ))}
        </ScrollView>
      </View>

      <Text color={colors.muted} style={{ paddingHorizontal: 24, marginBottom: 12 }} accessibilityLiveRegion="polite">
        {isLoading ? 'Loading' : `${shown.length} ${shown.length === 1 ? 'restaurant' : 'restaurants'}`}
      </Text>
      <FlatList
        data={shown}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 130, gap: 24 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ padding: 20, borderRadius: 22, backgroundColor: colors.card }}>
              <Text weight="bold">Nothing matches that</Text>
              <Text color={colors.muted}>Try another search or cuisine.</Text>
            </View>
          
          ) : undefined
        }
        renderItem={({ item }) => <RestaurantCard r={item} height={150} />}
      />
    </View>
  );
}
