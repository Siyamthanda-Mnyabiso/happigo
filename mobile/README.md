# HappiGo customer app (React Native)

Expo SDK 58 with Expo Router. Talks to the same Supabase project as the web app.

## Run it

```bash
cd mobile
cp .env.example .env        # fill in the Supabase URL and publishable key
npm install
npx expo start              # scan the QR code with Expo Go on your phone
npx expo start --web        # or preview in the browser
```

Expo Go is enough for everything built so far. Push notifications and maps will need a development
build (`eas build --profile development`).

## How it is laid out

- `src/app/` screens (Expo Router). `(tabs)` has Home, Search, Orders, Profile with the floating pill bar.
- `src/components/` shared pieces. `src/lib/` Supabase client, auth, cart, data hooks.
- `@core/*` is `../src/lib/*`: the web app's money, pricing, cart rules, order statuses and photo
  fallbacks. One copy, so a pricing rule is fixed once for both apps.

## Rules that must not change

- The cart holds ids and quantities only. Names and prices always come from the database and
  `place_order` checks everything again.
- No commission and no service fee anywhere. Money is integer cents.
- Photos come from the restaurant, then the matching photo from the design, then an emoji tile.

## Not built yet

Push notifications, live map tracking, realtime order updates (it polls every 10 to 15 seconds),
payments (card is a stub in `place_order`), favourites, ratings, promo codes, item options.
