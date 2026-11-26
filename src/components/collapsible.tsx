import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CollapsibleProps {
  /** text in the tappable header */
  label: string;
  /** controlled: whether it's open - leave out (with onOpenChange) to let it keep its own state */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** uncontrolled: whether it starts open */
  defaultOpen?: boolean;
  children?: ReactNode;
}

/**
 * a header that shows / hides its content - plain react native, the same props as @expo/ui's Collapsible
 * (which is a native view that needs a Host and RNHostView around react native content)
 */
export function Collapsible({ label, isOpen, onOpenChange, defaultOpen = false, children }: CollapsibleProps) {
  const theme = useTheme();
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = isOpen ?? ownOpen;
  const toggle = () => {
    setOwnOpen(!open);
    onOpenChange?.(!open);
  };

  return (
    // animates the content below moving when this opens / closes
    <Animated.View layout={LinearTransition}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${label}, ${open ? 'collapse' : 'expand'}`}
        hitSlop={6}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.label}>
          {label}
        </ThemedText>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <SymbolView
            name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
            size={18}
            tintColor={theme.textSecondary}
          />
        </View>
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.body}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 40 },
  label: { flex: 1 },
  pressed: { opacity: 0.7 },
  body: { gap: Spacing.three, paddingTop: Spacing.two },
});
