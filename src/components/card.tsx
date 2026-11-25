import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import type { EntityIcon } from '@/components/ha/entity-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps {
  icon: EntityIcon;
  title: string;
  /** shown on the right side of the header */
  right?: ReactNode;
  /** lets the card get smaller than its content, when that scrolls on its own */
  shrink?: boolean;
  children?: ReactNode;
}

export function Card({ icon, title, right, shrink = false, children }: CardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, shrink && styles.shrink]}>
      <View style={styles.header}>
        <SymbolView name={icon} size={18} tintColor={theme.text} />
        <ThemedText type="smallBold" style={styles.title} accessibilityRole="header">
          {title}
        </ThemedText>
        {right}
      </View>
      {children}
    </ThemedView>
  );
}

/** shown while the card's entity state is still "unknown" */
export function CardPlaceholder({ icon, title }: { icon: EntityIcon; title: string }) {
  return (
    <Card icon={icon} title={title}>
      <ActivityIndicator style={styles.placeholder} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  shrink: { flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 40 },
  title: { flex: 1 },
  placeholder: { paddingVertical: Spacing.four },
});
