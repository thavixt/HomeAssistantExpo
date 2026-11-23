# Home Assistant Expo app

A React Native (Expo) port of parts of [hass-react](https://github.com/thavixt/hass-react), a personal Home Assistant dashboard.

Tabs: **Lights** (lights, switches, scenes), **Climate** (Gree AC), **TV** (Vidaa TV + remote).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your HA url and a long-lived access token
npx expo start
```

Entity IDs live in [`src/lib/entities.ts`](src/lib/entities.ts).

> `EXPO_PUBLIC_*` variables are inlined into the bundle, so the token ends up in the built app - fine for a personal build, don't distribute it.

## Checks

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
