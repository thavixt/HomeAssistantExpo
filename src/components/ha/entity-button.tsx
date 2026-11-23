import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type EntityIcon = SymbolViewProps['name'];

interface EntityButtonProps {
  icon?: EntityIcon;
  label: string;
  /** a smaller second line under the label, e.g. when an automation last ran */
  detail?: string;
  /** filled style, like the pwa's "default" button variant */
  active?: boolean;
  pending?: boolean;
  loading?: boolean;
  unavailable?: boolean;
  onPress: () => void;
  /** spoken by screen readers, e.g. "Turn on Entrance light" */
  accessibilityLabel: string;
  /** set for toggles (lights, switches), leave out for one-shot actions (scenes) */
  accessibilityChecked?: boolean;
}

export function EntityButton({
  icon,
  label,
  detail,
  active = false,
  pending = false,
  loading = false,
  unavailable = false,
  onPress,
  accessibilityLabel,
  accessibilityChecked,
}: EntityButtonProps) {
  const theme = useTheme();
  // "on" inverts the colors, so it works in both light and dark mode without an accent color
  // off is a shade lighter than the card (backgroundElement), so it still reads as a button - the pwa's "secondary"
  const bg = active ? theme.text : theme.backgroundSelected;
  const fg = active ? theme.background : theme.text;
  const disabled = loading || unavailable;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityChecked === undefined ? 'button' : 'switch'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: pending || loading, disabled, checked: accessibilityChecked }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        (pressed || pending) && styles.dimmed,
        unavailable && styles.unavailable,
      ]}>
      {(icon || loading || pending) && (
        <View style={styles.icon}>
          {loading || pending ? (
            <ActivityIndicator size="small" color={fg} />
          ) : (
            icon && <SymbolView name={icon} size={18} tintColor={fg} />
          )}
        </View>
      )}
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.label, { color: fg }]}>
          {loading ? 'Loading' : label}
        </Text>
        {detail && !loading && (
          <Text numberOfLines={1} style={[styles.detail, { color: fg }]}>
            {detail}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: Spacing.three,
  },
  icon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flexShrink: 1 },
  label: { fontSize: 14, fontWeight: 500 },
  detail: { fontSize: 12, opacity: 0.7 },
  dimmed: { opacity: 0.6 },
  unavailable: { opacity: 0.35 },
});
