'use client';

import { CameraIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';

const MAX_SIDE = 1600;

/** Phone photos are often 5 MB or more. Shrink to 1600px JPEG here so uploads are quick and small. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // the server still checks type and size
  }
}

export function PhotoInput({
  name,
  label,
  currentUrl,
  error,
}: {
  name: string;
  label: string;
  currentUrl?: string | null;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    const small = await shrink(chosen);
    const dt = new DataTransfer();
    dt.items.add(small);
    if (input.current) input.current.files = dt.files;
    setPreview(URL.createObjectURL(small));
  }

  return (
    <div className="mb-5">
      <label htmlFor={`f-${name}`} className="mb-2 block text-base font-semibold">
        {label}
      </label>
      <label
        htmlFor={`f-${name}`}
        className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-card has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
      >
        {preview && (
          // A local preview of the chosen file, not a hosted image, so next/image does not apply.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        <span className="relative flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold shadow">
          <CameraIcon weight="bold" className="size-5" aria-hidden />{' '}
          {preview ? 'Change photo' : 'Add a photo'}
        </span>
        <input
          ref={input}
          id={`f-${name}`}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          className="sr-only"
          aria-describedby={error ? `f-${name}-err` : undefined}
        />
      </label>
      {error && (
        <p id={`f-${name}-err`} className="mt-1 text-base text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
