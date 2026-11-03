export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;

export type PhotoCheck = { ok: true; ext: 'jpg' | 'png' | 'webp' } | { ok: false; message: string };

/** The checks a server action makes on an uploaded photo. The bucket enforces the same limits again. */
export function checkPhoto(file: { type: string; size: number }): PhotoCheck {
  const ext = TYPES[file.type as keyof typeof TYPES];
  if (!ext) return { ok: false, message: 'Use a JPG, PNG or WebP photo.' };
  if (file.size > MAX_PHOTO_BYTES)
    return { ok: false, message: 'That photo is too big. Use one under 4 MB.' };
  return { ok: true, ext };
}

/** A file input with nothing chosen still sends an empty file. */
export function hasPhoto(v: FormDataEntryValue | null): v is File {
  return v instanceof File && v.size > 0;
}
