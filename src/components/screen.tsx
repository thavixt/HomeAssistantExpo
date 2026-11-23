import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useHeaderHeight } from '@/hooks/use-header-height';

/** scrolling tab content, pushed below the shared header in AppTabs */
export function Screen({ children }: { children: ReactNode }) {
  const headerHeight = useHeaderHeight();
  // clear of the home indicator / android's navigation bar - 0 on web
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          // the header's own bottom padding makes up the rest of the gap
          { paddingTop: headerHeight + Spacing.three, paddingBottom: insets.bottom + Spacing.four },
        ]}
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
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
});
