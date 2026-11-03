import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@native/supabase';

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export type Picked = { uri: string; mimeType: string };

/** Opens the photo library. Returns null when the person backs out. */
export async function pickPhoto(): Promise<Picked | { error: string } | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: 'Allow photo access in Settings to add a photo.' };
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  const mimeType = a.mimeType ?? 'image/jpeg';
  if (!TYPES[mimeType]) return { error: 'Use a JPG, PNG or WebP photo.' };
  return { uri: a.uri, mimeType };
}

/** Uploads into the restaurant's own folder (the bucket only allows that) and returns the public address. */
export async function uploadPhoto(restaurantId: string, photo: Picked): Promise<{ url: string } | { error: string }> {
  const body = await (await fetch(photo.uri)).arrayBuffer();
  if (body.byteLength > MAX_BYTES) return { error: 'That photo is too big. Use one under 4 MB.' };
  const path = `${restaurantId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${TYPES[photo.mimeType]}`;
  const { error } = await supabase.storage.from('food-photos').upload(path, body, { contentType: photo.mimeType });
  if (error) return { error: 'Could not upload the photo. Try again.' };
  return { url: supabase.storage.from('food-photos').getPublicUrl(path).data.publicUrl };
}
