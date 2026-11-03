'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin';
import { friendlyError } from '@/lib/driver';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { error?: string };

const id = z.uuid();
const BAD_ID: ActionState = { error: 'Something went wrong. Try again.' };

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(routes.admin.signIn);
}

export async function setRestaurantSuspended(rid: string, suspend: boolean): Promise<ActionState> {
  if (!id.safeParse(rid).success) return BAD_ID;
  const { supabase } = await getAdmin();
  const { error } = await supabase.rpc('admin_set_restaurant_suspended', { rid, suspend });
  if (error) return { error: friendlyError(error) };
  revalidatePath(routes.admin.restaurants);
  revalidatePath(routes.admin.overview);
  return {};
}

export async function setDriverSuspended(uid: string, suspend: boolean): Promise<ActionState> {
  if (!id.safeParse(uid).success) return BAD_ID;
  const { supabase } = await getAdmin();
  const { error } = await supabase.rpc('admin_set_driver_suspended', { uid, suspend });
  if (error) return { error: friendlyError(error) };
  revalidatePath(routes.admin.drivers);
  revalidatePath(routes.admin.overview);
  return {};
}

export async function cancelOrder(oid: string): Promise<ActionState> {
  if (!id.safeParse(oid).success) return BAD_ID;
  const { supabase } = await getAdmin();
  const { error } = await supabase.rpc('admin_cancel_order', { oid });
  if (error) return { error: friendlyError(error) };
  revalidatePath(routes.admin.orders);
  revalidatePath(routes.admin.overview);
  return {};
}
