# Home Assistant Expo app

A personal [Home Assistant](https://www.home-assistant.io/) dashboard for my phone, built with Expo / React Native.

It's a port of my web dashboard, [thavixt/hass-react](https://github.com/thavixt/hass-react) (a React PWA), made mostly as React Native practice. It runs on Android, iOS and the web from one codebase, and talks to Home Assistant over its WebSocket API through the [`hass-react`](https://github.com/dlwiest/hass-react) library.

It's built for one specific home - the entity IDs, scripts and devices are mine - so it isn't a general-purpose Home Assistant client. It could still be a useful example of wiring `hass-react` into an Expo app.

## Tabs

| Tab | What it does |
|---|---|
| **Lights** (home) | Toggles the lights and smart plugs, activates scenes |
| **Climate** | Gree AC: target temperature, mode and fan speed, inside and outside temperature |
| **TV** | Vidaa TV: power, app picker, volume (capped at 20%), shortcut scripts, and a remote with a D-pad and media keys |
| **Automations** | Turns automations on and off, shows when each last ran |
| **Activity** | What the lights, AC, TV, scenes and automations did in the last 10 days, and what caused it |
| **Devices** | Battery and charging state of the phones, tablet and laptop, when each was last seen, and a "find my phone" button |
| **System** | The Raspberry Pi's CPU, temperature, memory and uptime, the phone's Wi-Fi, backups, pending updates (with Install) and restarts |
| **Security** | Camera snapshots, and a live view that refreshes every second |
| **Assist** | Asks the Gemini conversation agent, or says a message out loud on the phone, tablet or TV |

All tabs are in the header, sorted alphabetically - Lights stays the home tab.

## Setup

Needs Node.js and a Home Assistant instance with a [long-lived access token](https://developers.home-assistant.io/docs/auth_api/#long-lived-access-token).

```bash
npm install
cp .env.example .env.local   # then fill it in, see below
npx expo start               # press w for web, or open it on a phone (see Running on a phone)
```

`.env.local` (gitignored):

| Variable | |
|---|---|
| `EXPO_PUBLIC_HA_URL` | The Home Assistant URL, e.g. `https://ha.example.com`. Prefer `https://` and a real hostname - Android release builds block plain `http://`, and often can't resolve `.local` names |
| `EXPO_PUBLIC_HA_ACCESS_TOKEN` | A long-lived access token |
| `EXPO_PUBLIC_HOME_WIFI_NETWORK` | Optional. The home Wi-Fi's name - the System tab then shows the phone as "Connected" while it's on it |

> `EXPO_PUBLIC_*` variables are built into the app bundle, so the token ends up in the built app. That's fine for a personal build, but don't share the APK or publish the web build.

To point the app at your own home, change the entity IDs in [`src/constants/entities.ts`](src/constants/entities.ts).

## Running on a phone

- **Quick test:** install Expo Go, run `npx expo start`, press `s` to switch to Expo Go, and scan the QR code. The phone has to be on the same network as the computer.
- **Installable APK** (Android, runs without the computer), built in the cloud with [EAS](https://docs.expo.dev/build/introduction/):

  ```bash
  npx eas-cli@latest login
  # cloud builds don't see .env.local - give EAS the same values:
  npx eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_HA_URL --value https://… --visibility plaintext
  npx eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_HA_ACCESS_TOKEN --value … --visibility sensitive
  npx eas-cli@latest build -p android --profile preview
  ```

  Open the link it prints on the phone to download and install the APK. The profiles are in [`eas.json`](eas.json): `preview` (APK), `development` (debug build with the dev client) and `production`.

## Project structure

```
src/
  app/                 routes (Expo Router) - one file per tab, _layout.tsx sets up the HA connection
  components/
    widgets/           a card per tab (lights, climate, tv, automations, devices, system, security, assist, activity)
    ha/                entity buttons - light, switch, scene, script, automation
    app-tabs.tsx       the header with the connection status and the tabs
  hooks/               service calls with retry (use-action), HA config / discovery lookups, clocks
  constants/           entity IDs, theme colors and spacing
  lib/                 tab titles and icons (sections.ts), time formatting, config
```

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npx expo-doctor    # dependency and config issues
```
