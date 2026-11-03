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
    -- Stand-in for Supabase Storage: just the two tables the photo policies touch.
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated, anon;
    grant insert, update, delete on storage.objects to authenticated;
    grant select on storage.objects to authenticated;
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
