import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ChipOption {
  label: string;
  value: string;
}

interface ChipGroupProps {
  label: string;
  options: ChipOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  pending?: boolean;
}

/** a single-choice row of chips - replaces the pwa's Select, which is awkward on a phone */
export function ChipGroup({ label, options, value, onChange, disabled = false, pending = false }: ChipGroupProps) {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        {pending && <ActivityIndicator size="small" />}
      </View>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => !selected && onChange(option.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: selected ? theme.text : theme.backgroundSelected },
                pressed && styles.pressed,
                disabled && styles.disabled,
              ]}>
              <Text style={[styles.chipText, { color: selected ? theme.background : theme.text }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  chipText: { fontSize: 13, fontWeight: 500 },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
});
