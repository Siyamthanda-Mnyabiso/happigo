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
  it('guards the admin area but leaves its sign in open', () => {
    expect(areaFor(routes.admin.orders)?.signIn).toBe(routes.admin.signIn);
    expect(areaFor(routes.admin.signIn)?.public).toContain(routes.admin.signIn);
  });
  it('does not match lookalike prefixes', () => {
    expect(areaFor('/restaurants-near-me')).toBeUndefined();
  });
});
