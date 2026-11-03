import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { colors } from '@native/theme';
import { supabase } from '@native/supabase';
import { Button, Text } from '@native/ui';

/** Moves an order on. `.eq('status', from)` means a double tap or a stale screen cannot act twice. */
export async function moveOrder(id: string, from: 'new' | 'preparing', patch: { status: 'preparing'; prep_minutes: number } | { status: 'declined' } | { status: 'ready' }) {
  const { data, error } = await supabase.from('orders').update(patch).eq('id', id).eq('status', from).select('id');
  if (error) return 'Something went wrong. Try again.';
  if (!data?.length) return 'This order has already been dealt with. Refresh to see the latest.';
  return null;
}

/** Decline and Accept. `prep` is the chosen prep time in minutes. */
export function RespondButtons({ orderId, prep, uid, onDone }: { orderId: string; prep: number; uid: string | undefined; onDone?: (accepted: boolean) => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(accept: boolean) {
    setBusy(true);
    setError(null);
    const err = await moveOrder(orderId, 'new', accept ? { status: 'preparing', prep_minutes: prep } : { status: 'declined' });
    await qc.invalidateQueries({ queryKey: ['orders', uid] });
    setBusy(false);
    if (err) return setError(err);
    onDone?.(accept);
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button label="Decline" variant="outline" disabled={busy} onPress={() => run(false)} style={{ width: 112, paddingHorizontal: 0 }} />
        <Button label={busy ? 'Saving' : 'Accept order'} disabled={busy} onPress={() => run(true)} style={{ flex: 1 }} />
      </View>
      {error ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 8 }}>{error}</Text> : null}
    </View>
  );
}

export function ReadyButton({ orderId, uid, onDone }: { orderId: string; uid: string | undefined; onDone?: () => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    setBusy(true);
    setError(null);
    const err = await moveOrder(orderId, 'preparing', { status: 'ready' });
    await qc.invalidateQueries({ queryKey: ['orders', uid] });
    qc.invalidateQueries({ queryKey: ['order', orderId] });
    setBusy(false);
    if (err) return setError(err);
    onDone?.();
  }
  return (
    <View>
      <Button label={busy ? 'Saving' : 'Mark as ready'} disabled={busy} onPress={run} />
      {error ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 8 }}>{error}</Text> : null}
    </View>
  );
}
