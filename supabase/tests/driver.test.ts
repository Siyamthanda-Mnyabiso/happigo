import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, type Db } from './db';

const D1 = '00000000-0000-0000-0000-0000000000d1';
const D2 = '00000000-0000-0000-0000-0000000000d2';
const OWNER = '00000000-0000-0000-0000-0000000000a1';
const CUST = '00000000-0000-0000-0000-0000000000c1';
const REST = '10000000-0000-0000-0000-0000000000a1';
const BR = '20000000-0000-0000-0000-0000000000a1';
const O1 = '30000000-0000-0000-0000-0000000000a1';
const O2 = '30000000-0000-0000-0000-0000000000a2';

let db: Db;
beforeAll(async () => {
  db = await createDb();
  await db.exec(`
    insert into auth.users (id, raw_user_meta_data) values
      ('${D1}', '{"role":"driver","phone":"+27820000001"}'),
      ('${D2}', '{"role":"driver","phone":"+27820000002"}'),
      ('${OWNER}', '{"role":"restaurant"}'),
      ('${CUST}', '{"role":"customer"}');
    insert into restaurants (id, owner_id, name) values ('${REST}', '${OWNER}', 'Burger Shack');
    insert into branches (id, restaurant_id, name, address, lat, lng)
      values ('${BR}', '${REST}', 'Long St', '88 Long St, Cape Town', -33.9249, 18.4241);
    insert into orders (id, branch_id, customer_id, customer_name, delivery_address, delivery_instructions,
        status, prep_minutes, food_cents, delivery_fee_cents, tip_cents, delivery_lat, delivery_lng)
      values ('${O1}', '${BR}', '${CUST}', 'Siya M.', '12 Main Rd, Gardens', 'Gate code 1234',
        'preparing', 15, 14300, 1500, 1000, -33.9349, 18.4241);
    insert into orders (id, branch_id, customer_name, status, prep_minutes, food_cents, delivery_fee_cents)
      values ('${O2}', '${BR}', 'Lerato K.', 'preparing', 15, 5000, 1500);
    insert into order_items (order_id, name, quantity, unit_price_cents) values ('${O1}', 'Cheeseburger', 2, 6500);
    update driver_profiles set is_online = true where user_id = '${D1}';
  `);
});
afterAll(() => db.close());

const call = (uid: string, q: string) => as(db, 'authenticated', uid, q);

describe('driver accounts', () => {
  it('creates a driver profile with their phone on signup', async () => {
    const { rows } = await db.query<{ phone: string }>(
      `select phone from driver_profiles where user_id = '${D1}'`,
    );
    expect(rows[0].phone).toBe('+27820000001');
  });
  it('does not create one for other roles', async () => {
    const { rows } = await db.query(
      `select 1 from driver_profiles where user_id in ('${OWNER}', '${CUST}')`,
    );
    expect(rows).toEqual([]);
  });
  it("lets a driver go online but not touch someone else's profile", async () => {
    await call(D2, `update driver_profiles set is_online = true where user_id = '${D1}'`);
    const { rows } = await db.query<{ is_online: boolean }>(
      `select is_online from driver_profiles where user_id = '${D2}'`,
    );
    expect(rows[0].is_online).toBe(false);
    expect(
      (
        await call(
          D2,
          `update driver_profiles set is_online = true where user_id = '${D2}' returning user_id`,
        )
      ).rows,
    ).toHaveLength(1);
    await db.exec(`update driver_profiles set is_online = false where user_id = '${D2}'`);
  });
});

describe('available deliveries', () => {
  it('shows nothing to an offline driver', async () => {
    expect((await call(D2, 'select * from driver_available_deliveries()')).rows).toEqual([]);
  });
  it('shows an online driver the open deliveries with pay and distance', async () => {
    const { rows, error } = await call(D1, 'select * from driver_available_deliveries()');
    expect(error).toBeNull();
    const o1 = rows.find((r) => r.order_id === O1)!;
    expect(o1.restaurant_name).toBe('Burger Shack');
    expect(o1.driver_pay_cents).toBe(2500);
    expect(o1.item_count).toBe(2);
    expect(Number(o1.distance_km)).toBeCloseTo(1.1, 1);
  });
  it('never exposes the customer before the driver accepts', async () => {
    const { rows } = await call(D1, 'select * from driver_available_deliveries()');
    const keys = Object.keys(rows[0]);
    expect(keys).not.toContain('customer_name');
    expect(keys).not.toContain('delivery_address');
    expect((await call(D1, 'select id from orders')).rows).toEqual([]);
  });
  it('hides deliveries the driver declined', async () => {
    await call(D1, `select decline_delivery('${O2}')`);
    const { rows } = await call(D1, 'select order_id from driver_available_deliveries()');
    expect(rows.map((r) => r.order_id)).toEqual([O1]);
  });
});

describe('accepting', () => {
  it('only lets drivers do it', async () => {
    expect((await call(CUST, `select accept_delivery('${O1}')`)).error).toMatch(/only drivers/i);
    expect((await call(OWNER, `select accept_delivery('${O1}')`)).error).toMatch(/only drivers/i);
    expect((await as(db, 'anon', null, `select accept_delivery('${O1}')`)).error).toMatch(
      /permission denied/i,
    );
  });
  it('needs the driver to be online', async () => {
    expect((await call(D2, `select accept_delivery('${O1}')`)).error).toMatch(/go online/i);
  });
  it('gives the delivery to exactly one driver', async () => {
    await db.exec(`update driver_profiles set is_online = true where user_id = '${D2}'`);
    expect((await call(D1, `select accept_delivery('${O1}')`)).error).toBeNull();
    expect((await call(D2, `select accept_delivery('${O1}')`)).error).toMatch(/someone else/i);
  });
  it('then reveals the customer, address, items and restaurant to that driver only', async () => {
    const o = await call(
      D1,
      'select customer_name, delivery_address, delivery_instructions from orders',
    );
    expect(o.rows).toEqual([
      {
        customer_name: 'Siya M.',
        delivery_address: '12 Main Rd, Gardens',
        delivery_instructions: 'Gate code 1234',
      },
    ]);
    expect((await call(D1, 'select name from order_items')).rows).toHaveLength(1);
    expect((await call(D1, 'select name from restaurants')).rows).toEqual([
      { name: 'Burger Shack' },
    ]);
    expect((await call(D2, 'select id from orders')).rows).toEqual([]);
    expect((await call(D2, 'select name from restaurants')).rows).toEqual([]);
    expect((await call(D1, 'select name from branches')).rows).toEqual([{ name: 'Long St' }]);
    expect((await call(D2, 'select name from branches')).rows).toEqual([]);
  });
  it('does not allow a second delivery until the first is done', async () => {
    await db.exec(`delete from delivery_declines`);
    expect((await call(D1, `select accept_delivery('${O2}')`)).error).toMatch(
      /finish your current/i,
    );
  });
});

describe('completing a delivery', () => {
  it('cannot be picked up before the restaurant says ready', async () => {
    expect((await call(D1, `select mark_picked_up('${O1}')`)).error).toMatch(
      /not marked this order ready/i,
    );
  });
  it('cannot be delivered before pickup', async () => {
    await db.exec(`update orders set status = 'ready' where id = '${O1}'`);
    expect((await call(D1, `select mark_delivered('${O1}')`)).error).toMatch(
      /pick the order up first/i,
    );
  });
  it("is the assigned driver's job only", async () => {
    expect((await call(D2, `select mark_picked_up('${O1}')`)).error).toBeTruthy();
  });
  it('runs pickup then delivery and stamps both times', async () => {
    expect((await call(D1, `select mark_picked_up('${O1}')`)).error).toBeNull();
    expect((await call(D1, `select mark_delivered('${O1}')`)).error).toBeNull();
    const { rows } = await db.query<{ status: string; picked_up_at: string; delivered_at: string }>(
      `select status, picked_up_at, delivered_at from orders where id = '${O1}'`,
    );
    expect(rows[0].status).toBe('delivered');
    expect(rows[0].picked_up_at).not.toBeNull();
    expect(rows[0].delivered_at).not.toBeNull();
  });
  it('lets the driver take a new delivery afterwards', async () => {
    expect((await call(D1, `select accept_delivery('${O2}')`)).error).toBeNull();
  });
});

describe('direct writes', () => {
  it('are impossible for a driver', async () => {
    const r = await call(
      D1,
      `update orders set status = 'delivered', delivery_fee_cents = 99999 where id = '${O2}'`,
    );
    expect(r.error).toMatch(/permission denied/i);
    const { rows } = await call(
      D1,
      `update orders set status = 'delivered' where id = '${O2}' returning id`,
    );
    expect(rows).toEqual([]);
  });
  it('earn the fee plus tip and nothing else', async () => {
    const { rows } = await db.query<{ driver_pay_cents: number }>(
      `select driver_pay_cents from orders where id = '${O1}'`,
    );
    expect(rows[0].driver_pay_cents).toBe(2500);
  });
});
