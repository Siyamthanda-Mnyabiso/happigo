import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, type Db } from './db';

const ADMIN = '00000000-0000-0000-0000-0000000000ad';
const D1 = '00000000-0000-0000-0000-0000000000d1';
const OWNER = '00000000-0000-0000-0000-0000000000a1';
const CUST = '00000000-0000-0000-0000-0000000000c1';
const REST = '10000000-0000-0000-0000-0000000000a1';
const BR = '20000000-0000-0000-0000-0000000000a1';
const O1 = '30000000-0000-0000-0000-0000000000a1';
const O2 = '40000000-0000-0000-0000-0000000000a2';

let db: Db;
beforeAll(async () => {
  db = await createDb();
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ADMIN}', 'staff@happigo.test', '{"role":"customer"}'),
      ('${D1}', 'd1@happigo.test', '{"role":"driver","full_name":"Thabo D."}'),
      ('${OWNER}', 'owner@happigo.test', '{"role":"restaurant","full_name":"Owner O."}'),
      ('${CUST}', 'cust@happigo.test', '{"role":"customer","full_name":"Siya M."}');
    update profiles set role = 'admin' where id = '${ADMIN}';
    insert into restaurants (id, owner_id, name, cuisine) values ('${REST}', '${OWNER}', 'Burger Shack', 'Burgers');
    insert into branches (id, restaurant_id, name, address, accepting_orders)
      values ('${BR}', '${REST}', 'Long St', '88 Long St', true);
    insert into subscriptions (restaurant_id, plan) values ('${REST}', 'smb');
    insert into bank_accounts (restaurant_id, bank, account_holder, account_last4) values ('${REST}', 'FNB', 'Burger Shack', '4821');
    insert into orders (id, branch_id, customer_id, customer_name, status, food_cents, delivery_fee_cents)
      values ('${O1}', '${BR}', '${CUST}', 'Siya M.', 'new', 10000, 1500);
    insert into orders (id, branch_id, customer_id, customer_name, status, food_cents, delivery_fee_cents, delivered_at)
      values ('${O2}', '${BR}', '${CUST}', 'Siya M.', 'delivered', 5000, 1500, now());
    insert into order_items (order_id, name, quantity, unit_price_cents) values ('${O1}', 'Cheeseburger', 2, 5000);
    update driver_profiles set is_online = true where user_id = '${D1}';
  `);
});
afterAll(() => db.close());

const admin = (q: string) => as(db, 'authenticated', ADMIN, q);

describe('admin access', () => {
  it.each([
    ['a customer', CUST],
    ['a restaurant owner', OWNER],
    ['a driver', D1],
  ])('refuses %s', async (_n, uid) => {
    for (const q of [
      'select admin_overview()',
      'select * from admin_restaurants()',
      'select * from admin_drivers()',
      'select * from admin_orders()',
      'select * from admin_customers()',
      `select admin_cancel_order('${O1}')`,
      `select admin_set_restaurant_suspended('${REST}', true)`,
    ]) {
      const r = await as(db, 'authenticated', uid, q);
      expect(r.error, q).toMatch(/Only HappiGo staff/);
    }
  });
  it('refuses signed out visitors', async () => {
    expect((await as(db, 'anon', null, 'select admin_overview()')).error).toMatch(
      /permission denied/,
    );
  });
  it('says who is an admin', async () => {
    expect((await admin('select is_admin() as a')).rows[0].a).toBe(true);
    expect((await as(db, 'authenticated', CUST, 'select is_admin() as a')).rows[0].a).toBe(false);
  });
  it('cannot be self-assigned at signup', async () => {
    await db.exec(
      `insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000ee', '{"role":"admin"}')`,
    );
    const { rows } = await db.query<{ role: string }>(
      `select role from profiles where id = '00000000-0000-0000-0000-0000000000ee'`,
    );
    expect(rows[0].role).toBe('customer');
  });
});

describe('admin reads', () => {
  it('counts today for the overview', async () => {
    const { rows, error } = await admin('select admin_overview() as o');
    expect(error).toBeNull();
    const o = rows[0].o as Record<string, number>;
    expect(o.orders_today).toBe(2);
    expect(o.food_today_cents).toBe(15000);
    expect(o.restaurants_live).toBe(1);
    expect(o.drivers_online).toBe(1);
  });
  it('lists restaurants with a status', async () => {
    const { rows } = await admin('select * from admin_restaurants()');
    expect(rows[0]).toMatchObject({ name: 'Burger Shack', status: 'live', plan: 'smb' });
  });
  it('shows a restaurant with owner email and bank', async () => {
    const { rows } = await admin(`select admin_restaurant('${REST}') as r`);
    expect(rows[0].r).toMatchObject({ owner_email: 'owner@happigo.test', bank: 'FNB ending 4821' });
  });
  it('lists drivers', async () => {
    const { rows } = await admin('select * from admin_drivers()');
    expect(rows[0]).toMatchObject({ name: 'Thabo D.', status: 'online' });
  });
  it('finds orders by code and by customer, and filters by tab', async () => {
    const code = O1.replaceAll('-', '').slice(0, 6);
    expect((await admin(`select * from admin_orders('#${code}')`)).rows).toHaveLength(1);
    expect((await admin(`select * from admin_orders('siya')`)).rows).toHaveLength(2);
    expect((await admin(`select * from admin_orders(null, 'delivered')`)).rows).toHaveLength(1);
    expect((await admin(`select * from admin_orders(null, 'new')`)).rows).toHaveLength(1);
  });
  it('shows an order with items and what the customer paid', async () => {
    const { rows } = await admin(`select admin_order('${O1}') as o`);
    const o = rows[0].o as { paid_cents: number; items: unknown[]; customer_email: string };
    expect(o.paid_cents).toBe(11500);
    expect(o.items).toHaveLength(1);
    expect(o.customer_email).toBe('cust@happigo.test');
  });
  it('lists customers with email and spend', async () => {
    const { rows } = await admin('select * from admin_customers()');
    expect(rows.find((r) => r.email === 'cust@happigo.test')).toMatchObject({
      orders: 2,
      spent_cents: 5000,
    });
  });
});

describe('suspending', () => {
  it('takes a restaurant off the live list and puts it back', async () => {
    await admin(`select admin_set_restaurant_suspended('${REST}', true)`);
    expect((await admin('select * from admin_restaurants()')).rows[0].status).toBe('suspended');
    const listed = await as(db, 'anon', null, 'select id from restaurants');
    expect(listed.rows).toEqual([]);
    await admin(`select admin_set_restaurant_suspended('${REST}', false)`);
    expect((await admin('select * from admin_restaurants()')).rows[0].status).toBe('live');
  });
  it('lets the owner see a suspension but not lift it', async () => {
    await admin(`select admin_set_restaurant_suspended('${REST}', true)`);
    const own = await as(db, 'authenticated', OWNER, 'select * from suspensions');
    expect(own.rows).toHaveLength(1);
    await as(db, 'authenticated', OWNER, `delete from suspensions where subject_id = '${REST}'`);
    expect((await db.query('select 1 from suspensions')).rows).toHaveLength(1);
    await admin(`select admin_set_restaurant_suspended('${REST}', false)`);
  });
  it('stops a suspended driver taking deliveries and takes them offline', async () => {
    await admin(`select admin_set_driver_suspended('${D1}', true)`);
    expect((await admin('select * from admin_drivers()')).rows[0].status).toBe('suspended');
    const r = await as(db, 'authenticated', D1, 'select * from driver_available_deliveries()');
    expect(r.error).toMatch(/suspended/);
    await admin(`select admin_set_driver_suspended('${D1}', false)`);
    expect((await admin('select * from admin_drivers()')).rows[0].status).toBe('offline');
  });
});

describe('cancelling', () => {
  it('cancels a live order', async () => {
    expect((await admin(`select admin_cancel_order('${O1}')`)).error).toBeNull();
    const { rows } = await db.query<{ status: string }>(
      `select status from orders where id = '${O1}'`,
    );
    expect(rows[0].status).toBe('cancelled');
  });
  it('will not cancel a delivered order', async () => {
    const r = await admin(`select admin_cancel_order('${O2}')`);
    expect(r.error).toMatch(/no longer be cancelled/);
  });
});
