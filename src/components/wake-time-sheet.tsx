import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { TextButton } from '@/components/text-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface WakeTimeSheetProps {
  onSave: () => void;
  onClose: () => void;
  children: ReactNode;
}

/** a bottom sheet around the time input, where there's no time dialog to use instead (ios and web) */
export function WakeTimeSheet({ onSave, onClose, children }: WakeTimeSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close the wake time" />
      <ThemedView style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.header}>
          <ThemedText type="smallBold">Wake time</ThemedText>
          <IconButton icon={{ ios: 'xmark', android: 'close', web: 'close' }} label="Close the wake time" onPress={onClose} />
        </View>
        {children}
        <TextButton label="Save" accessibilityLabel="Save the wake time" onPress={onSave} />
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
