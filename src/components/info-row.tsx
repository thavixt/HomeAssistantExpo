import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import type { EntityIcon } from '@/components/ha/entity-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface InfoRowProps {
  icon: EntityIcon;
  label: string;
  /** right side, e.g. a <ThemedText> value and a button */
  children: ReactNode;
  /** a smaller line under the row, e.g. "next backup in 5h" */
  detail?: ReactNode;
}

/** "icon  Label ........ value" - a line of the System card */
export function InfoRow({ icon, label, children, detail }: InfoRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <SymbolView name={icon} size={16} tintColor={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
        <View style={styles.value}>{children}</View>
      </View>
      {detail}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 28 },
  label: { flex: 1 },
  value: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexShrink: 1 },
});
