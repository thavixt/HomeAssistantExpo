import { SymbolView } from 'expo-symbols';
import { useEntity, useServiceCall } from 'hass-react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import type { EntityIcon } from '@/components/ha/entity-button';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { ENTITIES, objectId } from '@/constants/entities';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { SECTIONS } from '@/lib/sections';
import { relativePast } from '@/lib/time';

/* below this, a battery is shown in red - at or below HALF_BATTERY, in amber */
const LOW_BATTERY = 25;
const HALF_BATTERY = 50;

/* the device tracker updates regularly while the app runs (the battery sensor doesn't,
   when the level doesn't change) - this long without an update, the device is offline */
const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

/* speaks at full volume and wakes the screen - see the "Phone: speak" script */
const FIND_PHONE_MESSAGE =
  'Itt vagyok! Itt vagyok! Felolvasok egy hosszabb mondatot, hogy legyen időd megkeresned engem, a telefonod, ha megint elfelejtetted volna, hova tettél le.';

interface Device {
  name: string;
  icon: EntityIcon;
  /** battery percentage sensor */
  level: string;
  /** charging state sensor */
  batteryState: string;
  /** the batteryState value while charging (or plugged in) */
  chargingState: string;
  /** readable names for the batteryState values */
  stateLabels?: Record<string, string>;
  /** updates regularly while the device is on - its last update is the "last seen" time */
  heartbeat: string;
  findable?: boolean;
}

/* the mobile app's battery sensors and device tracker */
const mobileApp = (
  name: string,
  icon: EntityIcon,
  entities: { batteryLevel: string; batteryState: string; tracker: string },
  findable?: boolean,
): Device => ({
  name,
  icon,
  level: entities.batteryLevel,
  batteryState: entities.batteryState,
  chargingState: 'charging',
  heartbeat: entities.tracker,
  findable,
});

const PHONE_ICON: EntityIcon = { ios: 'iphone', android: 'smartphone', web: 'smartphone' };

const DEVICES: Device[] = [
  mobileApp('Phone', PHONE_ICON, ENTITIES.phone, true),
  mobileApp('Dashboard tablet', { ios: 'ipad', android: 'tablet_android', web: 'tablet_android' }, ENTITIES.dashboardTablet),
  mobileApp('Dashboard phone', PHONE_ICON, ENTITIES.dashboardPhone),
  {
    name: 'Laptop',
    icon: { ios: 'laptopcomputer', android: 'laptop', web: 'laptop' },
    // HASS.Agent - the power line status is "Online" while plugged in
    level: ENTITIES.laptop.batteryLevel,
    batteryState: ENTITIES.laptop.powerlineStatus,
    chargingState: 'Online',
    stateLabels: { Online: 'plugged in', Offline: 'on battery' },
    // Tailscale polls it while the laptop is online
    heartbeat: ENTITIES.laptop.lastSeen,
  },
];

function batteryIcon(level: number, charging: boolean): EntityIcon {
  if (charging) return { ios: 'battery.100percent.bolt', android: 'battery_charging_full', web: 'battery_charging_full' };
  if (level > 70) return { ios: 'battery.100percent', android: 'battery_full', web: 'battery_full' };
  if (level > 30) return { ios: 'battery.50percent', android: 'battery_4_bar', web: 'battery_4_bar' };
  if (level > 15) return { ios: 'battery.25percent', android: 'battery_2_bar', web: 'battery_2_bar' };
  return { ios: 'battery.0percent', android: 'battery_alert', web: 'battery_alert' };
}

function batteryColor(level: number, charging: boolean): ThemeColor {
  if (charging) return 'success';
  if (level < LOW_BATTERY) return 'danger';
  if (level <= HALF_BATTERY) return 'warning';
  return 'textSecondary';
}

function FindPhoneButton() {
  const { callService } = useServiceCall();
  const { run, pending } = useAction(
    () => callService('script', objectId(ENTITIES.scripts.phoneSpeak), { message: FIND_PHONE_MESSAGE }),
    'ring the phone',
  );

  return (
    <IconButton
      icon={{ ios: 'bell.and.waves.left.and.right', android: 'notifications_active', web: 'notifications_active' }}
      label="Find phone: wake it and say something out loud"
      size={32}
      pending={pending}
      onPress={() => void run()}
    />
  );
}

function DeviceRow({ device, now }: { device: Device; now: number }) {
  const theme = useTheme();
  const level = useEntity(device.level);
  const batteryState = useEntity(device.batteryState);
  const heartbeat = useEntity(device.heartbeat);

  const percent = Number(level.state);
  const known = !level.isUnavailable && level.state !== 'unknown' && Number.isFinite(percent);
  const charging = batteryState.state === device.chargingState;
  const stateLabel = device.stateLabels?.[batteryState.state] ?? batteryState.state.replaceAll('_', ' ');

  // a missing entity has no (valid) timestamp
  const seen = [heartbeat.lastUpdated, level.lastUpdated].find((d) => d && !Number.isNaN(d.getTime()));
  const stale = !seen || now - seen.getTime() > STALE_AFTER_MS;
  const lastSeen = seen ? relativePast(seen, now) : 'never';
  const color = theme[batteryColor(percent, charging)];

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${device.name}: ${known ? `${percent}%, ${stateLabel}` : 'battery unavailable'}, last seen ${lastSeen}`}>
      <SymbolView name={device.icon} size={20} tintColor={theme.textSecondary} />
      <View style={styles.name}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {device.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.detail}>
          {known ? `${stateLabel} · ` : ''}seen {lastSeen}
          {stale && seen ? ' (out of date)' : ''}
        </ThemedText>
      </View>
      {device.findable && <FindPhoneButton />}
      {known ? (
        <View style={[styles.battery, stale && styles.stale]}>
          <SymbolView name={batteryIcon(percent, charging)} size={22} tintColor={color} />
          <ThemedText type="small" style={[styles.percent, { color: percent < LOW_BATTERY && !charging ? color : theme.text }]}>
            {percent}%
          </ThemedText>
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Unavailable
        </ThemedText>
      )}
    </View>
  );
}

export function Devices() {
  // one clock for the whole card, so every "seen 5m ago" moves on together
  const now = useNow(60_000);

  return (
    <Card icon={SECTIONS.devices.icon} title={SECTIONS.devices.title}>
      <View style={styles.list}>
        {DEVICES.map((device) => (
          <DeviceRow key={device.level} device={device} now={now} />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 40 },
  name: { flex: 1 },
  detail: { fontSize: 12, lineHeight: 16 },
  battery: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  stale: { opacity: 0.5 },
  percent: { minWidth: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
