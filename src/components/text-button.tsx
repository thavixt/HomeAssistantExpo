import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TextButtonProps {
  label: string;
  onPress: () => void;
  /** for screen readers, when `label` alone is too terse - e.g. "Install 3 updates" */
  accessibilityLabel?: string;
  disabled?: boolean;
  pending?: boolean;
}

/** a small secondary button with a word on it, like the pwa's `size="xs"` buttons */
export function TextButton({ label, onPress, accessibilityLabel, disabled = false, pending = false }: TextButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || pending}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || pending, busy: pending }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundSelected },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {pending ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : (
        <Text style={[styles.text, { color: theme.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 64,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  text: { fontSize: 13, fontWeight: 600 },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
});
