import { describe, expect, it } from 'vitest';
import { checkPhoto, hasPhoto, MAX_PHOTO_BYTES } from './photos';

describe('checkPhoto', () => {
  it('accepts the three image types', () => {
    expect(checkPhoto({ type: 'image/jpeg', size: 1000 })).toEqual({ ok: true, ext: 'jpg' });
    expect(checkPhoto({ type: 'image/png', size: 1000 })).toEqual({ ok: true, ext: 'png' });
    expect(checkPhoto({ type: 'image/webp', size: 1000 })).toEqual({ ok: true, ext: 'webp' });
  });
  it.each(['image/svg+xml', 'image/gif', 'text/html', 'application/pdf', ''])(
    'rejects %s',
    (type) => {
      expect(checkPhoto({ type, size: 1000 }).ok).toBe(false);
    },
  );
  it('rejects anything over 4 MB', () => {
    expect(checkPhoto({ type: 'image/jpeg', size: MAX_PHOTO_BYTES }).ok).toBe(true);
    expect(checkPhoto({ type: 'image/jpeg', size: MAX_PHOTO_BYTES + 1 }).ok).toBe(false);
  });
});

describe('hasPhoto', () => {
  it('ignores the empty file an untouched input sends', () => {
    expect(hasPhoto(new File([], ''))).toBe(false);
    expect(hasPhoto(null)).toBe(false);
    expect(hasPhoto('text')).toBe(false);
    expect(hasPhoto(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBe(true);
  });
});
