import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ConnectionStatus } from '@/components/connection-status';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { HeaderHeightContext } from '@/hooks/use-header-height';
import { SECTIONS } from '@/lib/sections';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

/* a first guess until onLayout reports the real height */
const INITIAL_HEADER_HEIGHT = 88;

export default function AppTabs() {
  const [headerHeight, setHeaderHeight] = useState(INITIAL_HEADER_HEIGHT);

  return (
    <HeaderHeightContext value={headerHeight}>
      <Tabs>
        <TabSlot style={{ height: '100%' }} />
        <TabList asChild>
          <CustomTabList onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
            <TabTrigger name="index" href="/" asChild>
              <TabButton>Lights</TabButton>
            </TabTrigger>
            <TabTrigger name="climate" href="/climate" asChild>
              <TabButton>Climate</TabButton>
            </TabTrigger>
            <TabTrigger name="tv" href="/tv" asChild>
              <TabButton>TV</TabButton>
            </TabTrigger>
            <TabTrigger name="automations" href="/automations" asChild>
              <TabButton>{SECTIONS.automations.title}</TabButton>
            </TabTrigger>
            <TabTrigger name="devices" href="/devices" asChild>
              <TabButton>{SECTIONS.devices.title}</TabButton>
            </TabTrigger>
            <TabTrigger name="system" href="/system" asChild>
              <TabButton>{SECTIONS.system.title}</TabButton>
            </TabTrigger>
            <TabTrigger name="security" href="/security" asChild>
              <TabButton>{SECTIONS.security.title}</TabButton>
            </TabTrigger>
          </CustomTabList>
        </TabList>
      </Tabs>
    </HeaderHeightContext>
  );
}

export function TabButton({ children, isFocused, ref, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      // expo-router types the slot ref as RN's View, which no longer matches Pressable's ref on RN 0.88
      ref={ref as Ref<ComponentRef<typeof Pressable>>}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList({ onLayout, ...props }: TabListProps & { onLayout?: (e: LayoutChangeEvent) => void }) {
  return (
    <View {...props} onLayout={onLayout} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <View style={styles.brand}>
          <ThemedText type="smallBold" accessibilityRole="header">
            Home Assistant
          </ThemedText>
          <ConnectionStatus />
        </View>
        {/* wraps onto more lines when the tabs don't fit next to the brand */}
        <View style={styles.tabs}>{props.children}</View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    // full width rather than as wide as its content, otherwise nothing ever wraps
    width: '100%',
    rowGap: Spacing.three,
    columnGap: Spacing.four,
    maxWidth: MaxContentWidth,
  },
  brand: {
    flexGrow: 1,
    gap: Spacing.half,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
