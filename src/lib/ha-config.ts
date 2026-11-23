/* EXPO_PUBLIC_* vars are inlined into the bundle at build time, like VITE_* in the pwa */
export const HA_URL = process.env.EXPO_PUBLIC_HA_URL ?? '';
export const HA_ACCESS_TOKEN = process.env.EXPO_PUBLIC_HA_ACCESS_TOKEN ?? '';

if (__DEV__ && (!HA_URL || !HA_ACCESS_TOKEN)) {
  console.warn('EXPO_PUBLIC_HA_URL or EXPO_PUBLIC_HA_ACCESS_TOKEN is missing, see .env.example');
}
