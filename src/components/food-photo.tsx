import { clsx } from 'clsx';
import Image from 'next/image';
import { categoryPhoto, emojiFor, tintFor } from '@/lib/food';

/**
 * A food photo that fills its (relative, sized) parent. Order of preference: the restaurant's own
 * photo, then the matching photo from the design, then a tinted emoji tile.
 */
export function FoodPhoto({
  src,
  alt = '',
  hint,
  seed,
  sizes,
  emojiClass = 'text-5xl',
  priority,
}: {
  src: string | null;
  alt?: string;
  hint: string | null;
  seed: string;
  sizes: string;
  emojiClass?: string;
  priority?: boolean;
}) {
  const shown = src ?? categoryPhoto(hint);
  if (shown)
    return (
      <Image
        src={shown}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
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
