import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HAProvider } from 'hass-react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HA_ACCESS_TOKEN, HA_URL } from '@/lib/ha-config';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    // token mode skips hass-react's browser-only oauth code (window.location, localStorage)
    <HAProvider url={HA_URL} token={HA_ACCESS_TOKEN} authMode="token">
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </HAProvider>
  );
}
