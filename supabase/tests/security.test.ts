import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, type Db } from './db';

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const RA = '10000000-0000-0000-0000-00000000000a';
const RB = '10000000-0000-0000-0000-00000000000b';
const BR_A = '20000000-0000-0000-0000-00000000000a';
const ORDER_A = '30000000-0000-0000-0000-00000000000a';

let db: Db;
beforeAll(async () => {
  db = await createDb();
  await db.exec(`
    insert into auth.users (id, raw_user_meta_data) values
      ('${A}', '{"role":"restaurant"}'), ('${B}', '{"role":"restaurant"}');
    insert into restaurants (id, owner_id, name) values ('${RA}', '${A}', 'A'), ('${RB}', '${B}', 'B');
    insert into branches (id, restaurant_id, name) values ('${BR_A}', '${RA}', 'Long St');
    insert into subscriptions (restaurant_id, plan) values ('${RA}', 'smb');
    insert into bank_accounts (restaurant_id, bank, account_holder, account_last4) values ('${RA}', 'FNB', 'A', '4821');
    insert into menu_items (branch_id, name, price_cents, available) values
      ('${BR_A}', 'Cheeseburger', 6500, true), ('${BR_A}', 'Sold out', 3000, false);
    insert into orders (id, branch_id, food_cents, delivery_fee_cents) values ('${ORDER_A}', '${BR_A}', 14300, 1500);
  `);
});
afterAll(() => db.close());

describe('money', () => {
  it('has no commission or service fee column anywhere', async () => {
    const { rows } = await db.query(
      `select table_name, column_name from information_schema.columns
       where table_schema = 'public' and column_name ~* '(commission|service_fee|platform_fee)'`,
    );
    expect(rows).toEqual([]);
  });

  it('computes the order total as food plus delivery', async () => {
    const { rows } = await db.query<{ total_cents: number }>(
      `select total_cents from orders where id = '${ORDER_A}'`,
    );
    expect(rows[0].total_cents).toBe(15800);
  });
});

describe('sign up', () => {
  it('never lets a user make themselves admin', async () => {
    const id = '00000000-0000-0000-0000-0000000000ff';
    await db.exec(
      `insert into auth.users (id, raw_user_meta_data) values ('${id}', '{"role":"admin"}')`,
    );
    const { rows } = await db.query<{ role: string }>(
      `select role from profiles where id = '${id}'`,
    );
    expect(rows[0].role).toBe('customer');
  });

  it('accepts the restaurant role', async () => {
    const { rows } = await db.query<{ role: string }>(
      `select role from profiles where id = '${A}'`,
    );
    expect(rows[0].role).toBe('restaurant');
  });

  it('blocks changing your own role afterwards', async () => {
    await as(db, 'authenticated', A, `update profiles set role = 'admin' where id = '${A}'`);
    const { rows } = await db.query<{ role: string }>(
      `select role from profiles where id = '${A}'`,
    );
    expect(rows[0].role).toBe('restaurant');
  });
});

describe('restaurant data is private to its owner', () => {
  it("lets an owner read their own restaurant but not another's", async () => {
    const own = await as(db, 'authenticated', A, 'select id from restaurants');
    expect(own.rows.map((r) => r.id)).toEqual([RA]);
  });

  it("hides one restaurant's bank account from another", async () => {
    const { rows } = await as(db, 'authenticated', B, 'select * from bank_accounts');
    expect(rows).toEqual([]);
  });

  it("blocks writing into another restaurant's subscription", async () => {
    await as(
      db,
      'authenticated',
      B,
      `update subscriptions set plan = 'enterprise' where restaurant_id = '${RA}'`,
    );
    const { rows } = await db.query<{ plan: string }>(
      `select plan from subscriptions where restaurant_id = '${RA}'`,
    );
    expect(rows[0].plan).toBe('smb');
  });

  it('shows signed-out visitors nothing', async () => {
    for (const t of ['orders', 'bank_accounts', 'subscriptions', 'payouts', 'restaurants']) {
      const { rows } = await as(db, 'anon', null, `select * from ${t}`);
      expect(rows, t).toEqual([]);
    }
  });
});

describe('menus', () => {
  it('lets signed-out visitors browse available items only', async () => {
    const { rows, error } = await as(db, 'anon', null, 'select name from menu_items');
    expect(error).toBeNull();
    expect(rows.map((r) => r.name)).toEqual(['Cheeseburger']);
  });

  it('lets the owner see their unavailable items too', async () => {
    const { rows } = await as(db, 'authenticated', A, 'select name from menu_items order by name');
    expect(rows.map((r) => r.name)).toEqual(['Cheeseburger', 'Sold out']);
  });

  it("blocks editing another restaurant's menu", async () => {
    await as(db, 'authenticated', B, 'update menu_items set price_cents = 1');
    const { rows } = await db.query<{ price_cents: number }>('select price_cents from menu_items');
    expect(rows.every((r) => r.price_cents > 1)).toBe(true);
  });
});

describe('orders', () => {
  it('lets the owner change an order status', async () => {
    const r = await as(
      db,
      'authenticated',
      A,
      `update orders set status = 'preparing' where id = '${ORDER_A}' returning id`,
    );
    expect(r.error).toBeNull();
    expect(r.rows).toHaveLength(1);
  });

  it('never lets a restaurant change what an order costs', async () => {
    const r = await as(
      db,
      'authenticated',
      A,
      `update orders set food_cents = 1 where id = '${ORDER_A}'`,
    );
    expect(r.error).toMatch(/permission denied/i);
  });

  it("does not show another restaurant's orders", async () => {
    const { rows } = await as(db, 'authenticated', B, 'select id from orders');
    expect(rows).toEqual([]);
  });
});
