# Rajeeta Patient — Expo Go

Arabic RTL patient application for iPhone through Expo Go. It uses the same NestJS API and PostgreSQL data as the doctor portal, admin portal, and Android Flutter app.

## Run on the local network

From the repository root:

```bash
npm install
npm run dev:all
```

The launcher detects the current LAN address, updates every local API URL, starts ports 3000/3001/3002, and opens Expo in LAN mode. Scan the QR code with Expo Go on the iPhone.

To run only Expo:

```bash
npm run dev:expo
```

Set `EXPO_PUBLIC_API_URL` when the API is not on the default local address. See `.env.example`.

## Checks

```bash
npm run typecheck -w apps/patient-expo
npm run lint -w apps/patient-expo
npx expo-doctor
```

The Flutter Android APK remains in `apps/patient` and is built separately.
