import type { Href } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectionStatus } from '@/components/connection-status';
import { StatusChip } from '@/components/status-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { HeaderHeightContext } from '@/hooks/use-header-height';
import { useTheme } from '@/hooks/use-theme';
import { SECTIONS, type SectionId } from '@/lib/sections';

/* a first guess until onLayout reports the real height */
const INITIAL_HEADER_HEIGHT = 88;

/* every tab's route - `name` is the file in src/app */
const TABS: { name: string; href: Href; section: SectionId }[] = [
  { name: 'index', href: '/', section: 'lights' },
  { name: 'climate', href: '/climate', section: 'climate' },
  { name: 'tv', href: '/tv', section: 'tv' },
  { name: 'automations', href: '/automations', section: 'automations' },
  /* Assist, Devices, System and Security */
  { name: 'home', href: '/home', section: 'home' },
  { name: 'activity', href: '/activity', section: 'activity' },
  { name: 'pointer', href: '/pointer', section: 'pointer' },
];

/* alphabetically by title - the order only affects the buttons, Lights stays the home tab
   (it's "/" and the layout's anchor, see src/app/_layout.tsx) */
const SORTED_TABS = [...TABS].sort((a, b) => SECTIONS[a.section].title.localeCompare(SECTIONS[b.section].title));

/**
 * every tab, in the header, on every platform - a native bottom tab bar fits only 5 on android.
 * the header is drawn over the tab content, which pads itself by the header's height (see Screen)
 */
export default function AppTabs() {
  const [headerHeight, setHeaderHeight] = useState(INITIAL_HEADER_HEIGHT);

  return (
    <HeaderHeightContext value={headerHeight}>
      <Tabs>
        <TabSlot style={styles.slot} />
        <TabList asChild>
          <CustomTabList onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
            {SORTED_TABS.map(({ name, href, section }) => (
              <TabTrigger key={name} name={name} href={href} asChild>
                <TabButton>{SECTIONS[section].title}</TabButton>
              </TabTrigger>
            ))}
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
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type={isFocused ? 'backgroundSelected' : 'backgroundElement'} style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList({ onLayout, ...props }: TabListProps & { onLayout?: (e: LayoutChangeEvent) => void }) {
  const theme = useTheme();
  // below the status bar / notch on native - 0 on web
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      onLayout={onLayout}
      // solid, so the content scrolling underneath doesn't show around the header or behind the status bar
      style={[styles.tabListContainer, { paddingTop: insets.top + Spacing.three, backgroundColor: theme.background }]}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <View style={styles.brand}>
          <View style={styles.title}>
            <ThemedText type="smallBold" accessibilityRole="header" numberOfLines={1}>
              Home Assistant
            </ThemedText>
            <ConnectionStatus />
          </View>
          <StatusChip />
        </View>
        {/* wraps onto more lines when the tabs don't fit on one */}
        <View style={styles.tabs} accessibilityRole="tablist">
          {props.children}
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { height: '100%' },
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    // the same side margin as the cards below
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    // full width rather than as wide as its content, otherwise nothing ever wraps
    width: '100%',
    rowGap: Spacing.three,
    columnGap: Spacing.four,
    // as wide as the cards, which Screen insets from MaxContentWidth by its side padding
    maxWidth: MaxContentWidth - 2 * Spacing.four,
  },
  brand: {
    // a line of its own, above the tabs
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    // takes what the status chip leaves, so a long connection error is cut off instead of pushing the chip out
    flex: 1,
    minWidth: 0,
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
