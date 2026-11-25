import { SymbolView } from 'expo-symbols';
import { useEntity, useHAConnection } from 'hass-react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { EntityIcon } from '@/components/ha/entity-button';
import { ThemedText } from '@/components/themed-text';
import { WakeTimePicker } from '@/components/wake-time-picker';
import { ENTITIES } from '@/constants/entities';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { HOME_WIFI_NETWORK } from '@/lib/ha-config';
import { nextWeekdayOccurrence, relativeFuture } from '@/lib/time';

const ICON_SIZE = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
/* a time-only input_datetime's state */
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

const HOME: EntityIcon = { ios: 'house', android: 'home', web: 'home' };
const AWAY: EntityIcon = { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' };
const ALARM: EntityIcon = { ios: 'alarm', android: 'alarm', web: 'alarm' };

function Item({ icon, text }: { icon?: EntityIcon; text?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.item}>
      {icon && <SymbolView name={icon} size={ICON_SIZE} tintColor={theme.textSecondary} />}
      {text && (
        <ThemedText type="code" themeColor="textSecondary" numberOfLines={1} style={styles.text}>
          {text}
        </ThemedText>
      )}
    </View>
  );
}

function Presence() {
  const person = useEntity(ENTITIES.person);
  const wifi = useEntity(ENTITIES.phone.wifi);

  // the wi-fi sensor's state is the network's name - unlike the pwa's check, which expects an on/off sensor
  const home = person.state === 'home' || (!!HOME_WIFI_NETWORK && wifi.state === HOME_WIFI_NETWORK);
  if (!home && (person.state === 'unknown' || person.isUnavailable)) return null;

  // away: the zone's name if in one (e.g. "Work"), otherwise the icon says enough
  const zone = home || person.state === 'not_home' ? undefined : person.state;
  return (
    <View accessible accessibilityLabel={home ? 'Peti is at home' : `Peti is away${zone ? `, at ${zone}` : ''}`}>
      <Item icon={home ? HOME : AWAY} text={zone} />
    </View>
  );
}

/** when the "Morning" automation fires next - press it to change the wake time */
function Alarm({ now }: { now: number }) {
  const automation = useEntity(ENTITIES.automations.turnOnTv);
  const wakeTime = useEntity(ENTITIES.helpers.morningWakeTime);
  const [editing, setEditing] = useState(false);
  const { run, pending } = useAction(
    (time: string) =>
      wakeTime.callService('input_datetime', 'set_datetime', {
        entity_id: ENTITIES.helpers.morningWakeTime,
        time: `${time}:00`,
      }),
    (time) => `set the wake time to ${time}`,
  );

  if (automation.state !== 'on' || !TIME_PATTERN.test(wakeTime.state)) return null;

  // "HH:MM", without the helper's seconds
  const time = wakeTime.state.slice(0, 5);
  const alarm = nextWeekdayOccurrence(wakeTime.state, now);
  // within a day, the time alone is unambiguous
  const day = alarm.getTime() - now < DAY_MS ? '' : `${alarm.toLocaleDateString([], { weekday: 'short' })} `;

  return (
    <>
      <Pressable
        onPress={() => setEditing(true)}
        disabled={pending}
        accessibilityRole="button"
        accessibilityLabel={`Next alarm at ${day}${time}, ${relativeFuture(alarm, now)}. Change the wake time`}
        accessibilityState={{ disabled: pending, busy: pending }}
        hitSlop={{ top: 14, bottom: 14, left: 4, right: 14 }}
        style={({ pressed }) => (pressed || pending) && styles.dimmed}>
        <Item icon={ALARM} text={`${day}${time}`} />
      </Pressable>
      {/* mounted only while open, so it always starts from the current wake time */}
      {editing && (
        <WakeTimePicker
          time={time}
          onClose={() => setEditing(false)}
          onSave={(newTime) => {
            setEditing(false);
            if (newTime !== time) void run(newTime);
          }}
        />
      )}
    </>
  );
}

/** "Nov 25 · home · 06:30" - today's date, presence and the next morning alarm, for the header */
export function StatusChip() {
  const { lastConnectedAt } = useHAConnection();
  // ticking, so the date moves on at midnight and the alarm to its next day
  const now = useNow(30_000);

  // nothing to show until the first connection - after that, the last known states stay while it reconnects
  if (!lastConnectedAt) return null;

  const today = new Date(now);
  return (
    <View style={styles.chip}>
      <View accessible accessibilityLabel={today.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}>
        <Item text={today.toLocaleDateString([], { month: 'short', day: 'numeric' })} />
      </View>
      <Presence />
      <Alarm now={now} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  // a long zone name is cut off, rather than squeezing the title out
  text: { maxWidth: 80, fontVariant: ['tabular-nums'] },
  dimmed: { opacity: 0.5 },
});
