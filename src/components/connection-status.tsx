import { useHAConnection } from 'hass-react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const DOT_COLORS = {
  idle: '#8b8d98',
  connecting: '#f5a524',
  connected: '#30a46c',
  disconnected: '#e5484d',
  error: '#e5484d',
} as const;

export function ConnectionStatus() {
  const { connectionState, error, retryCount, nextRetryIn } = useHAConnection();

  let text: string = connectionState;
  if (connectionState === 'error' || connectionState === 'disconnected') {
    text = error ? `${connectionState}: ${error.message}` : connectionState;
    if (nextRetryIn) text += ` (retry #${retryCount + 1} in ${Math.ceil(nextRetryIn / 1000)}s)`;
  }

  return (
    <View style={styles.row} accessibilityLabel={`Home Assistant ${text}`}>
      <View style={[styles.dot, { backgroundColor: DOT_COLORS[connectionState] }]} />
      <ThemedText type="code" themeColor="textSecondary" numberOfLines={1}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
