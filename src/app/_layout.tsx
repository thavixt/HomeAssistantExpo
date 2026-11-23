import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { HAProvider } from 'hass-react';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HA_ACCESS_TOKEN, HA_URL } from '@/lib/ha-config';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const background = Colors[colorScheme === 'dark' ? 'dark' : 'light'].background;

  // the root view behind every screen (the <body> on web) shows through during navigation -
  // it defaults to white, so match it to the app's background to avoid white flashes in dark mode
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(background);
  }, [background]);

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
