# HappiGo

Food delivery with flat monthly restaurant subscriptions and no commission. Next.js 16 + Supabase.

## Run

```
cp .env.example .env.local   # add your Supabase URL and anon key
npm run dev
```

Apply `supabase/migrations/*.sql` to your Supabase project (`supabase db push`).

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
