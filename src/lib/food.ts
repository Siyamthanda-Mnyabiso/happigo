const EMOJI: [RegExp, string][] = [
  [/burger|grill|steak|braai/i, '🍔'],
  [/pizza|italian/i, '🍕'],
  [/sushi|japan/i, '🍣'],
  [/healthy|salad|vegan|vegetarian/i, '🥗'],
  [/curry|indian/i, '🍛'],
  [/chicken|wings|kfc|peri/i, '🍗'],
  [/chinese|noodle|asian|thai/i, '🍜'],
  [/taco|mexican/i, '🌮'],
  [/coffee|cafe|bakery|breakfast/i, '🥐'],
  [/dessert|ice|sweet|cake/i, '🍰'],
  [/drink|juice|cola|soda|smoothie/i, '🥤'],
  [/fries|chips|sides/i, '🍟'],
];

/** A food emoji that fits a cuisine or category name. Used when there is no photo yet. */
export function emojiFor(text: string | null | undefined): string {
  return EMOJI.find(([re]) => re.test(text ?? ''))?.[1] ?? '🍽️';
}

const TINTS = [
  'from-[#ffe1d1] to-[#ffb892]',
  'from-[#ffecc7] to-[#ffc873]',
  'from-[#ffd9d9] to-[#ff9f9f]',
  'from-[#fde4c8] to-[#f9a86b]',
] as const;

/** Which of the four warm tints a name gets. The same name always gets the same one. */
export function tintIndex(seed: string): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % TINTS.length;
}

/** The Tailwind classes for that tint (web). The mobile app maps the same index to colours. */
export function tintFor(seed: string): (typeof TINTS)[number] {
  return TINTS[tintIndex(seed)];
}

const PHOTOS: [RegExp, string][] = [
  [/burger|smash|cheese/i, '/food/burgers.jpg'],
  [/pizza|italian/i, '/food/pizza.jpg'],
  [/sushi|japan/i, '/food/sushi.jpg'],
  [/healthy|salad|vegan|vegetarian|bowl/i, '/food/healthy.jpg'],
  [/curry|indian|spice/i, '/food/curry.jpg'],
];

/** One of the five photos from the design, when the cuisine or dish fits. Used until a restaurant uploads its own. */
export function categoryPhoto(text: string | null | undefined): string | null {
  return PHOTOS.find(([re]) => re.test(text ?? ''))?.[1] ?? null;
}

/** The cuisines shown as round photo chips on the home screen, in the order the design has them. */
export const HOME_CUISINES = [
  { name: 'Burgers', photo: '/food/burgers.jpg' },
  { name: 'Pizza', photo: '/food/pizza.jpg' },
  { name: 'Sushi', photo: '/food/sushi.jpg' },
  { name: 'Healthy', photo: '/food/healthy.jpg' },
  { name: 'Curry', photo: '/food/curry.jpg' },
] as const;
