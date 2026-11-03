import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, type Db } from './db';

const OWNER = '00000000-0000-0000-0000-0000000000a1';
const OTHER = '00000000-0000-0000-0000-0000000000a2';
const REST = '10000000-0000-0000-0000-0000000000a1';
const REST2 = '10000000-0000-0000-0000-0000000000a2';
const OK_URL = `https://abcdef.supabase.co/storage/v1/object/public/food-photos/${REST}/cover.jpg`;
const insert = `insert into storage.objects (bucket_id, name) values ('food-photos', $1)`;

let db: Db;
beforeAll(async () => {
  db = await createDb();
  await db.exec(`
    insert into auth.users (id, raw_user_meta_data) values
      ('${OWNER}', '{"role":"restaurant"}'), ('${OTHER}', '{"role":"restaurant"}');
    insert into restaurants (id, owner_id, name) values ('${REST}', '${OWNER}', 'A'), ('${REST2}', '${OTHER}', 'B');
  `);
});
afterAll(() => db.close());

describe('photo storage policies', () => {
  it('lets an owner upload into their own restaurant folder', async () => {
    expect((await as(db, 'authenticated', OWNER, insert, [`${REST}/a.jpg`])).error).toBeNull();
  });
  it("refuses another restaurant's folder", async () => {
    const r = await as(db, 'authenticated', OWNER, insert, [`${REST2}/a.jpg`]);
    expect(r.error).toMatch(/row-level security/);
  });
  it.each(['loose.jpg', 'not-a-uuid/a.jpg', `${REST}/deep/er.jpg`, `${REST}/`, `../${REST}/a.jpg`])(
    'refuses odd path %s without crashing',
    async (name) => {
      const r = await as(db, 'authenticated', OWNER, insert, [name]);
      expect(r.error).toMatch(/row-level security/);
    },
  );
  it('refuses signed-out visitors', async () => {
    expect((await as(db, 'anon', null, insert, [`${REST}/b.jpg`])).error).toMatch(
      /permission denied/,
    );
  });
  it('lets an owner delete their photo but not anyone elses', async () => {
    await db.exec(
      `insert into storage.objects (bucket_id, name) values ('food-photos', '${REST2}/theirs.jpg')`,
    );
    await as(
      db,
      'authenticated',
      OWNER,
      `delete from storage.objects where name = '${REST2}/theirs.jpg'`,
    );
    const { rows } = await db.query(
      `select 1 from storage.objects where name = '${REST2}/theirs.jpg'`,
    );
    expect(rows).toHaveLength(1);
    await as(
      db,
      'authenticated',
      OWNER,
      `delete from storage.objects where name = '${REST}/a.jpg'`,
    );
    expect(
      (await db.query(`select 1 from storage.objects where name = '${REST}/a.jpg'`)).rows,
    ).toHaveLength(0);
  });
});

describe('photo address check', () => {
  const set = (url: string) =>
    as(db, 'authenticated', OWNER, `update restaurants set image_url = $1 where id = '${REST}'`, [
      url,
    ]);
  it('accepts an address in our bucket', async () => {
    expect((await set(OK_URL)).error).toBeNull();
  });
  it.each([
    'https://evil.com/x.jpg',
    'http://abcdef.supabase.co/storage/v1/object/public/food-photos/x/y.jpg',
    'https://abcdef.supabase.co/storage/v1/object/public/other-bucket/x/y.jpg',
    'javascript:alert(1)',
  ])('rejects %s', async (url) => {
    expect((await set(url)).error).toMatch(/restaurants_image_url_ours/);
  });
  it('applies to menu items too', async () => {
    await db.exec(
      `insert into branches (id, restaurant_id, name) values ('20000000-0000-0000-0000-0000000000a1', '${REST}', 'M')`,
    );
    const r = await as(
      db,
      'authenticated',
      OWNER,
      `insert into menu_items (branch_id, name, price_cents, category, image_url) values ('20000000-0000-0000-0000-0000000000a1', 'x', 100, 'c', 'https://evil.com/a.jpg')`,
    );
    expect(r.error).toMatch(/menu_items_image_url_ours/);
  });
});
