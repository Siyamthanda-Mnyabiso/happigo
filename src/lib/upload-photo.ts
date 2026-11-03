import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { checkPhoto } from './photos';
import type { Database } from './supabase/database.types';

const BUCKET = 'food-photos';

/** Upload as the signed-in owner (the bucket policy only allows their own folder). Returns the public address. */
export async function uploadPhoto(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const check = checkPhoto(file);
  if (!check.ok) return { error: check.message };
  const path = `${restaurantId}/${randomUUID()}.${check.ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) return { error: 'Could not upload the photo. Try again.' };
  return { url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}
