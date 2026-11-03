import { clsx } from 'clsx';
import Image from 'next/image';
import { emojiFor, tintFor } from '@/lib/food';

/** A food photo that fills its (relative, sized) parent. With no photo it shows a warm tinted tile and an emoji. */
export function FoodPhoto({
  src,
  alt,
  hint,
  seed,
  sizes,
  emojiClass = 'text-5xl',
  priority,
}: {
  src: string | null;
  alt: string;
  hint: string | null;
  seed: string;
  sizes: string;
  emojiClass?: string;
  priority?: boolean;
}) {
  if (src)
    return (
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    );
  return (
    <div
      aria-hidden
      className={clsx(
        'absolute inset-0 flex items-center justify-center bg-gradient-to-br',
        tintFor(seed),
        emojiClass,
      )}
    >
      {emojiFor(hint)}
    </div>
  );
}
