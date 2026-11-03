import { describe, expect, it } from 'vitest';
import {
  addToCart,
  cartCount,
  EMPTY_CART,
  parseCart,
  qtyOf,
  safeNext,
  serializeCart,
  setQty,
} from './cart';

const A = '40000000-0000-0000-0000-000000000001';
const B = '40000000-0000-0000-0000-000000000002';
const R1 = '20000000-0000-0000-0000-0000000000a1';
const R2 = '20000000-0000-0000-0000-0000000000a2';

describe('cart', () => {
  it('adds items and counts quantities', () => {
    let c = addToCart(EMPTY_CART, R1, A);
    c = addToCart(c, R1, A);
    c = addToCart(c, R1, B);
    expect(qtyOf(c, A)).toBe(2);
    expect(cartCount(c)).toBe(3);
  });
  it('starts a new cart when adding from another restaurant', () => {
    const c = addToCart(addToCart(EMPTY_CART, R1, A), R2, B);
    expect(c.branchId).toBe(R2);
    expect(c.lines).toEqual([{ id: B, qty: 1 }]);
  });
  it('removes a line at zero and empties the cart', () => {
    const c = setQty(addToCart(EMPTY_CART, R1, A), A, 0);
    expect(c).toEqual(EMPTY_CART);
  });
  it('never goes past 20 of an item', () => {
    expect(qtyOf(setQty(addToCart(EMPTY_CART, R1, A), A, 99), A)).toBe(20);
  });
});

describe('parseCart', () => {
  it('round trips', () => {
    const c = addToCart(EMPTY_CART, R1, A);
    expect(parseCart(serializeCart(c))).toEqual(c);
  });
  it.each([
    ['nothing', undefined],
    ['garbage', 'not json'],
    ['a bad id', '{"branchId":"x","lines":[]}'],
    ['a negative quantity', `{"branchId":"${R1}","lines":[{"id":"${A}","qty":-1}]}`],
    ['a huge quantity', `{"branchId":"${R1}","lines":[{"id":"${A}","qty":9999}]}`],
    ['extra nesting', '{"branchId":null,"lines":[{"id":{"$ne":1},"qty":1}]}'],
  ])('treats %s as an empty cart', (_n, raw) => {
    expect(parseCart(raw)).toEqual(EMPTY_CART);
  });
});

describe('safeNext', () => {
  it('allows same-site paths only', () => {
    expect(safeNext('/checkout', '/')).toBe('/checkout');
    for (const bad of [
      'https://evil.com',
      '//evil.com',
      'javascript:alert(1)',
      '/\\evil.com',
      '',
      null,
      undefined,
    ]) {
      expect(safeNext(bad, '/fallback'), String(bad)).toBe('/fallback');
    }
  });
});
