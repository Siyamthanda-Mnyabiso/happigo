# HappiGo Partner (React Native)

The restaurant app: sign in or join, choose a plan, connect a bank, accept orders, manage the menu, see earnings and payouts.

Shares code with the other apps: `../native-shared` (theme, buttons, Supabase client, auth, tab bar) and `../src/lib` (money, order codes, pricing, plans).

```
cp .env.example .env   # add the Supabase URL and anon key
npm install
npx expo start         # scan the QR code with Expo Go
npx expo start --web   # quick preview in a browser
```

Not built yet: several branches, opening hours, delivery radius, push notifications for new orders, receipts.
