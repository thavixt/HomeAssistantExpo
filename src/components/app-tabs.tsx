import { NativeTabs } from 'expo-router/native-tabs';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectionStatus } from '@/components/connection-status';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { HeaderHeightContext } from '@/hooks/use-header-height';
import { useTheme } from '@/hooks/use-theme';
import { SECTIONS } from '@/lib/sections';

export default function AppTabs() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  // a first guess until onLayout reports the real height
  const [headerHeight, setHeaderHeight] = useState(insets.top + 64);

  return (
    <HeaderHeightContext value={headerHeight}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <NativeTabs
          backgroundColor={colors.background}
          indicatorColor={colors.backgroundElement}
          labelStyle={{ selected: { color: colors.text } }}>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Lights</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="lightbulb" md="lightbulb" />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="climate">
            <NativeTabs.Trigger.Label>Climate</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="air.conditioner.horizontal" md="ac_unit" />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="tv">
            <NativeTabs.Trigger.Label>TV</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="tv" md="tv" />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="automations">
            <NativeTabs.Trigger.Label>{SECTIONS.automations.title}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={SECTIONS.automations.icon.ios} md={SECTIONS.automations.icon.android} />
          </NativeTabs.Trigger>

          {/* android's tab bar fits at most 5 tabs (it throws on a 6th), so the rest live behind this one */}
          <NativeTabs.Trigger name="more">
            <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="ellipsis" md="more_horiz" />
          </NativeTabs.Trigger>
        </NativeTabs>
        {/* shared by every tab, rendered after the native tabs so it's drawn on top of them (they fill the whole screen) */}
        <View
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          style={[styles.header, { paddingTop: insets.top + Spacing.two, backgroundColor: colors.background }]}>
          <ThemedText type="smallBold" style={styles.title} accessibilityRole="header">
            Home Assistant
          </ThemedText>
          <ConnectionStatus />
        </View>
      </View>
    </HeaderHeightContext>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  title: { fontSize: 18, lineHeight: 24 },
});
