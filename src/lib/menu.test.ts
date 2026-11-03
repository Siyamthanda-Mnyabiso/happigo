import { describe, expect, it } from 'vitest';
import { groupByCategory, menuItemSchema } from './menu';

const base = { name: 'Classic Cheeseburger', price: '65', category: 'Burgers', description: '' };

describe('menuItemSchema', () => {
  it('turns a typed price into cents and ticked boxes into booleans', () => {
    const r = menuItemSchema.parse({ ...base, available: 'on' });
    expect(r.price).toBe(6500);
    expect(r.available).toBe(true);
    expect(r.popular).toBe(false);
  });
  it('rejects a free or unreadable price', () => {
    expect(menuItemSchema.safeParse({ ...base, price: '0' }).success).toBe(false);
    expect(menuItemSchema.safeParse({ ...base, price: 'abc' }).success).toBe(false);
  });
  it('needs a name and a category', () => {
    expect(menuItemSchema.safeParse({ ...base, name: ' ' }).success).toBe(false);
    expect(menuItemSchema.safeParse({ ...base, category: '' }).success).toBe(false);
  });
});

describe('groupByCategory', () => {
  const items = [
    { category: 'Burgers', popular: true, n: 1 },
    { category: 'Sides', popular: false, n: 2 },
    { category: 'Burgers', popular: false, n: 3 },
  ];
  it('puts popular items first, then categories in order', () => {
    const g = groupByCategory(items);
    expect(g.map((x) => x.category)).toEqual(['Popular', 'Burgers', 'Sides']);
    expect(g[1].items.map((i) => i.n)).toEqual([1, 3]);
  });
  it('has no Popular group when nothing is popular', () => {
    expect(groupByCategory(items.map((i) => ({ ...i, popular: false })))[0].category).toBe(
      'Burgers',
    );
  });
});
