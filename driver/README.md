# HappiGo Driver (React Native)

The driver app: sign in or join, go online, accept deliveries, pick up, deliver, see earnings.

Shares code with the customer app in `../mobile`:

- `../native-shared`: theme, text and buttons, Supabase client, auth, logo.
- `../src/lib`: money, order codes, delivery stages (also used by the web app).

## Run

```
cp .env.example .env   # add the Supabase URL and anon key
npm install
npx expo start         # scan the QR code with Expo Go
npx expo start --web   # quick preview in a browser
```

Not built yet: live map and route, push notifications for new deliveries, phone number sign in, payouts, documents.
