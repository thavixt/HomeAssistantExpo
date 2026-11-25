import { useState } from 'react';

import type { WakeTimePickerProps } from '@/components/wake-time-picker';
import { WakeTimeSheet } from '@/components/wake-time-sheet';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** @expo/ui's time picker renders nothing on web, so this is the browser's own */
export function WakeTimePicker({ time, onSave, onClose }: WakeTimePickerProps) {
  const theme = useTheme();
  const [value, setValue] = useState(time);

  return (
    // the browser reports a cleared input as ''
    <WakeTimeSheet onSave={() => (value ? onSave(value) : onClose())} onClose={onClose}>
      <input
        type="time"
        aria-label="Wake time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          padding: Spacing.three,
          border: 'none',
          borderRadius: Spacing.three,
          fontSize: 16,
          color: theme.text,
          backgroundColor: theme.backgroundSelected,
          colorScheme: 'dark',
        }}
      />
    </WakeTimeSheet>
  );
}
