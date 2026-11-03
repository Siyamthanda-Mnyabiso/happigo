import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CaretDown, MagnifyingGlass, MapPin, SlidersHorizontal } from 'phosphor-react-native';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartButton } from '@/components/cart-button';
import { photoSource, PROMO_BANNER } from '@/components/food-image';
import { RestaurantCard } from '@/components/restaurant-card';
import { Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAddresses } from '@/lib/account';
import { useRestaurants } from '@/lib/data';
import { HOME_CUISINES } from '@core/food';
import { colors } from '@/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { firstName, session } = useAuth();
  const { data: restaurants, isLoading, error, refetch } = useRestaurants();
  const { data: addresses } = useAddresses();
  const [q, setQ] = useState('');
  const search = () => router.push({ pathname: '/search', params: q.trim() ? { q: q.trim() } : {} });

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 130 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delivery address"
            onPress={() => router.push(session ? '/addresses' : '/sign-in')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} weight="bold" color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text color={colors.muted}>Deliver to</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {addresses?.[0]?.address ?? 'Add your address'}
                </Text>
                <CaretDown size={16} weight="bold" color={colors.ink} />
              </View>
            </View>
          </Pressable>
          <CartButton />
        </View>

        <Text weight="extrabold" size={28} style={{ marginTop: 24 }}>
          {firstName ? `Hungry, ${firstName}?` : 'Hungry?'}
        </Text>

        <View style={{ marginTop: 16, height: 54, borderRadius: 27, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 8 }}>
          <MagnifyingGlass size={22} color={colors.muted} />
          <TextInput
            accessibilityLabel="Search restaurants or dishes"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={search}
            returnKeyType="search"
            placeholder="Search restaurants or dishes"
            placeholderTextColor={colors.mutedLight}
            style={{ flex: 1, marginLeft: 12, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.ink, height: 54 }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search"
            onPress={search}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}
          >
            <SlidersHorizontal size={22} weight="bold" color={colors.white} />
          </Pressable>
        </View>

        <View style={{ marginTop: 20, height: 148, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.brand }}>
          <Image source={PROMO_BANNER} contentFit="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} />
          <View style={{ padding: 20 }}>
            <Text weight="extrabold" size={21} color={colors.white} style={{ lineHeight: 25, maxWidth: 150 }}>
              No service fee on every order
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/search')}
              style={{ marginTop: 26, alignSelf: 'flex-start', height: 38, paddingHorizontal: 24, borderRadius: 19, backgroundColor: colors.white, justifyContent: 'center' }}
            >
              <Text weight="semibold" color={colors.brand}>
                Order now
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
          {HOME_CUISINES.map((c) => (
            <Pressable
              key={c.name}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              onPress={() => router.push({ pathname: '/search', params: { cuisine: c.name } })}
              style={{ alignItems: 'center', gap: 8 }}
            >
              <Image source={photoSource(c.photo)} contentFit="cover" style={{ width: 58, height: 58, borderRadius: 29 }} />
              <Text weight="medium">{c.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 28, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text weight="extrabold" size={20}>
            Restaurants
          </Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/search')}>
            <Text weight="semibold" color={colors.brand}>
              See all
            </Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <Text color={colors.muted} style={{ margin: 24 }}>
          Loading restaurants
        </Text>
      ) : error ? (
        <View style={{ margin: 24, padding: 20, borderRadius: 22, backgroundColor: colors.card }}>
          <Text weight="bold">Could not load restaurants</Text>
          <Pressable accessibilityRole="button" onPress={() => refetch()}>
            <Text weight="semibold" color={colors.brand}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : !restaurants?.length ? (
        <View style={{ margin: 24, padding: 20, borderRadius: 22, backgroundColor: colors.card }}>
          <Text weight="bold">No restaurants yet</Text>
          <Text color={colors.muted}>New restaurants are joining soon. Check back shortly.</Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={restaurants}
          keyExtractor={(r) => r.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 16, marginTop: 16 }}
          renderItem={({ item }) => <RestaurantCard r={item} width={230} height={132} />}
        />
      )}
    </ScrollView>
  );
}
