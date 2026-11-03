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

/** The same name always gets the same warm tint, so a list of photo-less cards still looks varied. */
export function tintFor(seed: string): (typeof TINTS)[number] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}
