import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COLUMNS, ENUMS } from '@/lib/supabase/database.types';
import { PLANS } from '@/lib/plans';
import { createDb, type Db } from './db';

let db: Db;
beforeAll(async () => {
  db = await createDb();
});
afterAll(() => db.close());

describe('types match the migration', () => {
  it('has exactly the columns the types declare', async () => {
    const { rows } = await db.query<{ table_name: string; column_name: string }>(
      `select table_name, column_name from information_schema.columns where table_schema = 'public'`,
    );
    const actual: Record<string, string[]> = {};
    for (const r of rows) (actual[r.table_name] ??= []).push(r.column_name);
    for (const t of Object.keys(actual)) actual[t].sort();
    const declared = Object.fromEntries(
      Object.entries(COLUMNS).map(([t, c]) => [t, Object.keys(c).sort()]),
    );
    expect(declared).toEqual(actual);
  });

  it('has exactly the enum values the types declare', async () => {
    const { rows } = await db.query<{ typname: string; enumlabel: string }>(
      `select t.typname, e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid order by e.enumsortorder`,
    );
    const actual: Record<string, string[]> = {};
    for (const r of rows) (actual[r.typname] ??= []).push(r.enumlabel);
    expect(actual).toEqual(Object.fromEntries(Object.entries(ENUMS).map(([k, v]) => [k, [...v]])));
  });

  it('has a plan in code for every plan in the database', () => {
    expect(Object.keys(PLANS).sort()).toEqual([...ENUMS.plan_id].sort());
  });
});
