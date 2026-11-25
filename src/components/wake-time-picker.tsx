import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform } from 'react-native';

import { WakeTimeSheet } from '@/components/wake-time-sheet';
import { formatTime, timeToday } from '@/lib/time';

export interface WakeTimePickerProps {
  /** "HH:MM" */
  time: string;
  onSave: (time: string) => void;
  onClose: () => void;
}

/** picks a time of day - opens as soon as it's mounted, unmount it to close */
export function WakeTimePicker({ time, onSave, onClose }: WakeTimePickerProps) {
  const [value, setValue] = useState(() => timeToday(time));

  if (Platform.OS === 'android') {
    // a material dialog, with its own OK and Cancel
    return (
      <DateTimePicker
        mode="time"
        presentation="dialog"
        value={value}
        is24Hour
        themeVariant="dark"
        onValueChange={(_, date) => onSave(formatTime(date))}
        onDismiss={onClose}
      />
    );
  }

  return (
    <WakeTimeSheet onSave={() => onSave(formatTime(value))} onClose={onClose}>
      {/* always inline on ios, and it reports every turn of the wheel - so it's saved by the sheet's button */}
      <DateTimePicker
        mode="time"
        display="spinner"
        value={value}
        themeVariant="dark"
        onValueChange={(_, date) => setValue(date)}
      />
    </WakeTimeSheet>
  );
}
