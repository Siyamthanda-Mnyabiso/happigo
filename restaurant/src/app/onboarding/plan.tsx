import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PLAN_LIST, type PlanId } from '@core/plans';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Button, Text } from '@native/ui';
import { ScreenHeader } from '@/components/screen-header';
import { usePartner } from '@/lib/partner';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid, partner, loaded } = usePartner();
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosen = plan ?? partner?.restaurant.plan ?? 'smb';

  async function save() {
    if (!uid || !loaded) return;
    setBusy(true);
    setError(null);
    // The restaurant row is created on the first onboarding step.
    let rid = partner?.restaurant.id;
    if (!rid) {
      const { data, error: err } = await supabase.from('restaurants').insert({ owner_id: uid, name: 'New restaurant' }).select('id').single();
      if (err) {
        setBusy(false);
        return setError('Could not save your plan. Try again.');
      }
      rid = data.id;
    }
    const { error: err } = await supabase.from('subscriptions').upsert({ restaurant_id: rid, plan: chosen });
    if (err) {
      setBusy(false);
      return setError('Could not save your plan. Try again.');
    }
    await qc.invalidateQueries({ queryKey: ['partner', uid] });
    setBusy(false);
    router.replace(partner?.restaurant.hasBank ? '/' : '/onboarding/bank');
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Choose your plan" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}>
        <Text color={colors.muted}>Step 2 of 3</Text>
        <Text weight="extrabold" size={28} accessibilityRole="header">One flat monthly fee</Text>
        <Text color={colors.muted} style={{ marginBottom: 24 }}>No commission on any order, ever.</Text>
        {PLAN_LIST.map((p) => {
          const on = chosen === p.id;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setPlan(p.id)}
              style={{ borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: on ? 2 : 1, borderColor: on ? colors.brand : colors.line }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text weight="bold" size={18}>{p.name}</Text>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: on ? 7 : 1.5, borderColor: on ? colors.brand : colors.line }} />
              </View>
              <Text color={colors.muted} style={{ marginBottom: 12 }}>{p.description}</Text>
              <Text weight="semibold" style={{ marginBottom: 8 }}>{p.feeNote}</Text>
              {p.perks.map((perk) => (
                <View key={perk} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 2 }}>
                  <Check size={18} weight="bold" color={colors.brand} />
                  <Text>{perk}</Text>
                </View>
              ))}
            </Pressable>
          );
        })}
        {error && <Text accessibilityRole="alert" color={colors.danger}>{error}</Text>}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: Math.max(insets.bottom, 24), backgroundColor: colors.white }}>
        <Button label={busy ? 'Saving' : 'Continue'} disabled={busy || !loaded} onPress={save} />
      </View>
    </View>
  );
}
