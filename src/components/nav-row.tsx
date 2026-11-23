import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import type { EntityIcon } from '@/components/ha/entity-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** a tappable list row that opens another screen */
export function NavRow({ href, icon, title }: { href: Href; icon: EntityIcon; title: string }) {
  const theme = useTheme();

  // not <Link asChild>: its Slot runs the child's style through StyleSheet.flatten, which drops
  // a ({ pressed }) => style function - so the row lost its flex row, padding and background
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="link"
      style={({ pressed }) => [styles.row, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
      <SymbolView name={icon} size={18} tintColor={theme.text} />
      <ThemedText type="small" style={styles.title}>
        {title}
      </ThemedText>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
        tintColor={theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  title: { flex: 1 },
  pressed: { opacity: 0.6 },
});
