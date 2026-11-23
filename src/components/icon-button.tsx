import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

import type { EntityIcon } from '@/components/ha/entity-button';
import { useTheme } from '@/hooks/use-theme';

interface IconButtonProps {
  /** leave out to show `text` instead, e.g. the remote's "OK" key */
  icon?: EntityIcon;
  text?: string;
  /** what the button does, for screen readers */
  label: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
  /** "primary" is filled, like the pwa's default button */
  variant?: 'primary' | 'secondary';
  size?: number;
}

export function IconButton({
  icon,
  text,
  label,
  onPress,
  disabled = false,
  pending = false,
  variant = 'secondary',
  size = 40,
}: IconButtonProps) {
  const theme = useTheme();
  const bg = variant === 'primary' ? theme.text : theme.backgroundSelected;
  const fg = variant === 'primary' ? theme.background : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: pending }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {pending ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <SymbolView name={icon} size={size * 0.45} tintColor={fg} />
      ) : (
        <Text style={[styles.text, { color: fg }]}>{text}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
  text: { fontSize: 14, fontWeight: 700 },
});
