import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, type Db } from './db';

const CUST = '00000000-0000-0000-0000-0000000000c1';
const CUST2 = '00000000-0000-0000-0000-0000000000c2';
const OWNER = '00000000-0000-0000-0000-0000000000a1';
const OWNER2 = '00000000-0000-0000-0000-0000000000a2';
const DRIVER = '00000000-0000-0000-0000-0000000000d1';
const REST = '10000000-0000-0000-0000-0000000000a1';
const REST2 = '10000000-0000-0000-0000-0000000000a2';
const BR = '20000000-0000-0000-0000-0000000000a1';
const BR2 = '20000000-0000-0000-0000-0000000000a2';
const BURGER = '40000000-0000-0000-0000-000000000001';
const FRIES = '40000000-0000-0000-0000-000000000002';
const SOLD_OUT = '40000000-0000-0000-0000-000000000003';
const OTHER = '40000000-0000-0000-0000-000000000004';

let db: Db;
beforeAll(async () => {
  db = await createDb();
  await db.exec(`
    insert into auth.users (id, raw_user_meta_data) values
      ('${CUST}', '{"role":"customer","full_name":"Siya Mnyabiso"}'), ('${CUST2}', '{"role":"customer"}'),
      ('${OWNER}', '{"role":"restaurant"}'), ('${OWNER2}', '{"role":"restaurant"}'),
      ('${DRIVER}', '{"role":"driver","full_name":"Thabo Mokoena"}');
    insert into restaurants (id, owner_id, name, delivery_fee_cents) values
      ('${REST}', '${OWNER}', 'Burger Shack', 1500), ('${REST2}', '${OWNER2}', 'Closed Place', 1000);
    insert into branches (id, restaurant_id, name, address, accepting_orders) values
      ('${BR}', '${REST}', 'Long St', '88 Long St', true), ('${BR2}', '${REST2}', 'Main', '1 Main', false);
    insert into subscriptions (restaurant_id, plan) values ('${REST}', 'smb'), ('${REST2}', 'smb');
    insert into bank_accounts (restaurant_id, bank, account_holder, account_last4) values
      ('${REST}', 'FNB', 'A', '4821'), ('${REST2}', 'FNB', 'B', '1111');
    insert into menu_items (id, branch_id, name, price_cents, available) values
      ('${BURGER}', '${BR}', 'Classic Cheeseburger', 6500, true), ('${FRIES}', '${BR}', 'Loaded Fries', 3500, true),
      ('${SOLD_OUT}', '${BR}', 'Sold out thing', 3000, false), ('${OTHER}', '${BR2}', 'Other place item', 1000, true);
  `);
});
afterAll(() => db.close());

const place = (uid: string, items: unknown, over: Record<string, string> = {}) =>
  as(
    db,
    'authenticated',
    uid,
    `select place_order($1::uuid, $2::jsonb, $3, $4, $5, $6, $7::integer) as id`,
    [
      over.branch ?? BR,
      JSON.stringify(items),
      over.address ?? '12 Main Rd, Gardens',
      'Gate code 1234',
      'No pickles',
      over.payment ?? 'card',
      over.tip ?? '1000',
    ],
  );
const cart = [
  { id: BURGER, qty: 1 },
  { id: FRIES, qty: 2 },
];

describe('placing an order', () => {
  let orderId: string;

  it('prices everything from the menu and the restaurant, never from the request', async () => {
    const r = await place(CUST, cart);
    expect(r.error).toBeNull();
    orderId = r.rows[0].id as string;
    const { rows } = await db.query<Record<string, unknown>>(
      `select food_cents, delivery_fee_cents, tip_cents, total_cents, driver_pay_cents, customer_name, status, payment_status, respond_by
         from orders where id = '${orderId}'`,
    );
    expect(rows[0]).toMatchObject({
      food_cents: 13500,
      delivery_fee_cents: 1500,
      tip_cents: 1000,
      total_cents: 15000,
      driver_pay_cents: 2500,
      customer_name: 'Siya Mnyabiso',
      status: 'new',
      payment_status: 'paid',
    });
    expect(rows[0].respond_by).not.toBeNull();
  });

  it('snapshots the items so later menu edits do not change the order', async () => {
    await db.exec(`update menu_items set name = 'Renamed', price_cents = 1 where id = '${BURGER}'`);
    const { rows } = await db.query<{ name: string; unit_price_cents: number }>(
      `select name, unit_price_cents from order_items where order_id = '${orderId}' order by name`,
    );
    expect(rows).toEqual([
      { name: 'Classic Cheeseburger', unit_price_cents: 6500 },
      { name: 'Loaded Fries', unit_price_cents: 3500 },
    ]);
    await db.exec(
      `update menu_items set name = 'Classic Cheeseburger', price_cents = 6500 where id = '${BURGER}'`,
    );
  });

  it('adds up the same item sent twice', async () => {
    const r = await place(
      CUST,
      [
        { id: FRIES, qty: 1 },
        { id: FRIES, qty: 2 },
      ],
      { tip: '0' },
    );
    const { rows } = await db.query<{ food_cents: number }>(
      `select food_cents from orders where id = '${r.rows[0].id}'`,
    );
    expect(rows[0].food_cents).toBe(10500);
  });

  it('leaves cash orders unpaid until collected', async () => {
    const r = await place(CUST, cart, { payment: 'cash' });
    const { rows } = await db.query<{ payment_status: string }>(
      `select payment_status from orders where id = '${r.rows[0].id}'`,
    );
    expect(rows[0].payment_status).toBe('pending');
  });

  it.each([
    ['an item that is sold out', [{ id: SOLD_OUT, qty: 1 }], {}, /no longer available/i],
    ["another restaurant's item", [{ id: OTHER, qty: 1 }], {}, /no longer available/i],
    ['an empty cart', [], {}, /cart is empty/i],
    ['zero of something', [{ id: BURGER, qty: 0 }], {}, /between 1 and 20/i],
    ['a huge quantity', [{ id: BURGER, qty: 21 }], {}, /between 1 and 20/i],
    ['a negative tip', cart, { tip: '-1' }, /tip must be/i],
    ['an absurd tip', cart, { tip: '999999' }, /tip must be/i],
    ['a missing address', cart, { address: '  ' }, /delivery address/i],
    ['a made up payment method', cart, { payment: 'bitcoin' }, /how you will pay/i],
    ['a restaurant that is closed', [{ id: OTHER, qty: 1 }], { branch: BR2 }, /not taking orders/i],
  ])('refuses %s', async (_name, items, over, message) => {
    const r = await place(CUST, items, over);
    expect(r.error).toMatch(message);
  });

  it('is only for customers', async () => {
    expect((await place(OWNER, cart)).error).toMatch(/sign in to order/i);
    expect((await place(DRIVER, cart)).error).toMatch(/sign in to order/i);
    expect(
      (await as(db, 'anon', null, `select place_order('${BR}', '[]', 'x', '', '', 'card', 0)`))
        .error,
    ).toMatch(/permission denied/i);
  });

  it('reaches the restaurant and the customer, nobody else', async () => {
    expect(
      (await as(db, 'authenticated', OWNER, `select id from orders where id = '${orderId}'`)).rows,
    ).toHaveLength(1);
    expect(
      (await as(db, 'authenticated', CUST, `select id from orders where id = '${orderId}'`)).rows,
    ).toHaveLength(1);
    expect(
      (await as(db, 'authenticated', CUST2, `select id from orders where id = '${orderId}'`)).rows,
    ).toEqual([]);
    expect(
      (await as(db, 'authenticated', OWNER2, `select id from orders where id = '${orderId}'`)).rows,
    ).toEqual([]);
  });

  it('never lets a customer change an order afterwards', async () => {
    const r = await as(
      db,
      'authenticated',
      CUST,
      `update orders set food_cents = 1 where id = '${orderId}'`,
    );
    expect(r.error).toMatch(/permission denied/i);
  });
});

describe('following an order', () => {
  it("shows the customer the driver's first name and vehicle once assigned", async () => {
    const r = await place(CUST, cart);
    const id = r.rows[0].id as string;
    expect(
      (await as(db, 'authenticated', CUST, `select * from order_tracking('${id}')`)).rows[0],
    ).toMatchObject({ status: 'new', driver_first_name: null });
    await db.exec(`update driver_profiles set vehicle_model = 'Honda Dio', vehicle_plate = 'CA 123 456' where user_id = '${DRIVER}';
      update orders set status = 'preparing', prep_minutes = 15, driver_id = '${DRIVER}' where id = '${id}'`);
    expect(
      (await as(db, 'authenticated', CUST, `select * from order_tracking('${id}')`)).rows[0],
    ).toMatchObject({
      status: 'preparing',
      driver_first_name: 'Thabo',
      vehicle_model: 'Honda Dio',
      vehicle_plate: 'CA 123 456',
    });
  });

  it("shows nothing for someone else's order", async () => {
    const id = (await db.query<{ id: string }>(`select id from orders limit 1`)).rows[0].id;
    expect(
      (await as(db, 'authenticated', CUST2, `select * from order_tracking('${id}')`)).rows,
    ).toEqual([]);
  });
});

describe('saved addresses', () => {
  it('belong to their owner only', async () => {
    await as(
      db,
      'authenticated',
      CUST,
      `insert into customer_addresses (user_id, label, address) values ('${CUST}', 'Home', '12 Main Rd')`,
    );
    expect(
      (await as(db, 'authenticated', CUST, 'select label from customer_addresses')).rows,
    ).toEqual([{ label: 'Home' }]);
    expect(
      (await as(db, 'authenticated', CUST2, 'select label from customer_addresses')).rows,
    ).toEqual([]);
    const steal = await as(
      db,
      'authenticated',
      CUST2,
      `insert into customer_addresses (user_id, label, address) values ('${CUST}', 'x', 'y')`,
    );
    expect(steal.error).toBeTruthy();
  });
});
