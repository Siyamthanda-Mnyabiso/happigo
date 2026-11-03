import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

const MIGRATIONS = path.resolve(__dirname, '../migrations');

/** In-memory Postgres with small stand-ins for Supabase's auth schema and roles, then the real migrations. */
export async function createDb() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text,
      raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    -- No default table grants on purpose: new Supabase projects have none, so the migrations must grant.
    grant all on all tables in schema public to service_role;
    alter default privileges in schema public grant all on tables to service_role;
  `);
  for (const f of fs
    .readdirSync(MIGRATIONS)
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    await db.exec(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'));
  }
  return db;
}

export type Db = Awaited<ReturnType<typeof createDb>>;

type Row = Record<string, unknown>;

/** Run a query as a Supabase role (and user). Returns rows, or the error message. */
export async function as(
  db: Db,
  role: 'anon' | 'authenticated',
  uid: string | null,
  q: string,
  params: unknown[] = [],
) {
  await db.exec(
    `select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${role};`,
  );
  try {
    return { rows: (await db.query(q, params)).rows as Row[], error: null as string | null };
  } catch (e) {
    return { rows: [] as Row[], error: (e as Error).message };
  } finally {
    await db.exec('reset role');
  }
}
