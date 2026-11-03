'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { friendlyError, getDriver } from '@/lib/driver';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';

export type DriverActionState = { error?: string; saved?: boolean };

const orderId = z.uuid();
const GONE = 'That delivery is no longer available.';

export async function setOnline(formData: FormData) {
  const { supabase, user } = await getDriver();
  await supabase
    .from('driver_profiles')
    .update({ is_online: formData.get('online') === 'true' })
    .eq('user_id', user.id);
  revalidatePath(routes.driver.home);
}

export async function acceptDelivery(
  _prev: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const id = orderId.safeParse(formData.get('orderId'));
  if (!id.success) return { error: GONE };
  const { supabase } = await getDriver();
  const { error } = await supabase.rpc('accept_delivery', { oid: id.data });
  if (error) return { error: friendlyError(error) };
  redirect(routes.driver.delivery(id.data));
}

export async function declineDelivery(
  _prev: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const id = orderId.safeParse(formData.get('orderId'));
  if (!id.success) return { error: GONE };
  const { supabase } = await getDriver();
  const { error } = await supabase.rpc('decline_delivery', { oid: id.data });
  if (error) return { error: friendlyError(error) };
  revalidatePath(routes.driver.home);
  return { saved: true };
}

export async function confirmPickup(
  _prev: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const id = orderId.safeParse(formData.get('orderId'));
  if (!id.success) return { error: GONE };
  const { supabase } = await getDriver();
  const { error } = await supabase.rpc('mark_picked_up', { oid: id.data });
  if (error) return { error: friendlyError(error) };
  revalidatePath(routes.driver.delivery(id.data));
  return { saved: true };
}

export async function confirmDelivered(
  _prev: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const id = orderId.safeParse(formData.get('orderId'));
  if (!id.success) return { error: GONE };
  const { supabase } = await getDriver();
  const { error } = await supabase.rpc('mark_delivered', { oid: id.data });
  if (error) return { error: friendlyError(error) };
  revalidatePath(routes.driver.delivery(id.data));
  return { saved: true };
}

const vehicle = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d[\d\s]{8,14}$/, 'Enter a valid phone number'),
  vehicleType: z.enum(['bike', 'scooter', 'car'], { error: 'Choose a vehicle' }),
  vehicleModel: z.string().trim().max(60),
  vehiclePlate: z.string().trim().max(20),
});

export async function saveProfile(
  _prev: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const parsed = vehicle.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase, user } = await getDriver();
  const { error } = await supabase
    .from('driver_profiles')
    .update({
      phone: parsed.data.phone,
      vehicle_type: parsed.data.vehicleType,
      vehicle_model: parsed.data.vehicleModel || null,
      vehicle_plate: parsed.data.vehiclePlate || null,
    })
    .eq('user_id', user.id);
  if (error) return { error: 'Could not save. Try again.' };
  revalidatePath(routes.driver.profile);
  return { saved: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(routes.driver.signIn);
}
