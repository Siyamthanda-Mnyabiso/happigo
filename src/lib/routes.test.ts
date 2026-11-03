import { describe, expect, it } from 'vitest';
import { areaFor, routes } from './routes';

describe('areaFor', () => {
  it('finds the restaurant area', () => {
    expect(areaFor(routes.restaurant.orders)?.signIn).toBe(routes.restaurant.signIn);
  });
  it('keeps the driver join page public', () => {
    expect(areaFor(routes.driver.join)?.public).toContain(routes.driver.join);
    expect(areaFor(routes.driver.home)?.signIn).toBe(routes.driver.signIn);
  });
  it('does not match lookalike prefixes', () => {
    expect(areaFor('/restaurants-near-me')).toBeUndefined();
  });
});
