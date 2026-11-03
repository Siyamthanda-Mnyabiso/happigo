# HappiGo

Food delivery with flat monthly restaurant subscriptions and no commission. Next.js 16 + Supabase.

## Run

```
cp .env.example .env.local   # add your Supabase URL and anon key
npm run dev
```

Apply `supabase/migrations/*.sql` to your Supabase project (`supabase db push`).

## Trying the Orders screen

Orders come from the customer app, which doesn't exist yet. After onboarding a test partner, run
`supabase/dev-seed.sql` in the Supabase SQL editor to add two sample new orders. It is never part of the migrations.

## Trying the driver app

Sign up at `/driver/join` (free). If Supabase email confirmation is on, confirm the email first. Then run
`supabase/dev-seed.sql` and `supabase/dev-seed-driver.sql` in the SQL editor, go online, and the delivery appears.
Driver pay is the delivery fee plus the tip.

## Admin site

HappiGo staff use `/admin` (sign in at `/admin/sign-in`). The admin role can never be chosen at signup, so promote a
person by hand: have them sign up as a customer, then run this once in the Supabase SQL editor:

```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'staff@example.com');
```

All admin data goes through `admin_*` database functions that check the caller is an admin (see
`supabase/migrations/20261103000900_admin.sql`), so no service-role key is used. Apply the migration with
`supabase db push` before the admin site is used.

## Checks

`npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`

## Where things live

- `src/lib/routes.ts`: every path. `src/lib/restaurant.ts`: who the signed-in partner is.
- `src/lib/supabase/database.types.ts`: typed schema. Replace with `supabase gen types` once a project is linked.
- `src/components/ui`: shared button, form and layout components. Colours are tokens in `globals.css`.
- `supabase/tests`: PGlite runs the real migrations in memory, checks row level security, and fails if the types drift from the SQL.

## Business rules baked into the code

- No commission or service fee anywhere. `calcOrderTotals` pays the restaurant the full food total.
- Money is integer cents. Full bank account numbers are never stored, only the last 4 digits.
- Plan prices are `null` until confirmed.

## Customer app

Customers use the root of the site: `/` (browse), `/r/[id]` (menu), `/cart`, `/checkout`, `/orders`, `/account`.
Browsing is public. Checkout, orders and account need a customer account (`/sign-up`).

- The cart is a cookie of ids and quantities only. Prices always come from the database, and `place_order` re-checks everything.
- Card payment is a **stub**: card orders are marked paid immediately. Replace it in `place_order` once Paystack or Peach is chosen.
- A restaurant shows up only when it has an active subscription, a bank account and a branch.
- To try it, run `supabase/dev-seed.sql` by hand in the SQL editor (dev only, never part of the migrations).
