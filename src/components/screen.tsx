import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useHeaderHeight } from '@/hooks/use-header-height';

interface ScreenProps {
  children: ReactNode;
  /** off for content that fits itself into the screen and scrolls on its own, e.g. a long list */
  scroll?: boolean;
}

/** (scrolling) tab content, pushed below the shared header in AppTabs */
export function Screen({ children, scroll = true }: ScreenProps) {
  const headerHeight = useHeaderHeight();
  // clear of the home indicator / android's navigation bar - 0 on web
  const insets = useSafeAreaInsets();
  const content = [
    styles.content,
    // the header's own bottom padding makes up the rest of the gap
    { paddingTop: headerHeight + Spacing.three, paddingBottom: insets.bottom + Spacing.four },
  ];

  if (!scroll) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.fixed, content]}>{children}</View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={content}
        // a tap on a button while the keyboard is up (e.g. Assist's send) acts right away, instead of only closing the keyboard
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  scroll: { width: '100%', maxWidth: MaxContentWidth },
  fixed: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
});
