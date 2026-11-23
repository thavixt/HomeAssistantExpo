import { useEntity, useEntityGroup, useServiceCall, type EntityState } from 'hass-react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { InfoRow } from '@/components/info-row';
import { TextButton } from '@/components/text-button';
import { ThemedText } from '@/components/themed-text';
import { ENTITIES } from '@/constants/entities';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useNow } from '@/hooks/use-now';
import { usePendingRestart } from '@/hooks/use-pending-restart';
import { useSystemDiscovery, type SystemEntities } from '@/hooks/use-system-discovery';
import { confirm } from '@/lib/confirm';
import { HOME_WIFI_NETWORK } from '@/lib/ha-config';
import { SECTIONS } from '@/lib/sections';
import { formatDuration, relativeFuture, relativePast } from '@/lib/time';

const PROC_USAGE_ALERT = 75;
const PROC_TEMP_ALERT = 60;
const MEM_USAGE_ALERT = 75;
const BACKUP_AGE_ALERT_DAYS = 4;

const isAvailable = (entity?: EntityState) => !!entity && entity.state !== 'unavailable' && entity.state !== 'unknown';

/** a sensor's value, rounded, with its unit - "–" while there's none */
function useReading(entityId: string) {
  const { state, attributes } = useEntity(entityId);
  const value = Number(state);
  const valid = state !== '' && Number.isFinite(value);
  const unit = (attributes.unit_of_measurement as string | undefined) ?? '';
  return { value, text: valid ? `${Math.round(value)}${unit}` : '–', valid };
}

function Value({ children, color }: { children: string; color?: ThemeColor }) {
  return (
    <ThemedText type="small" themeColor={color ?? 'text'} numberOfLines={1} style={styles.tabular}>
      {children}
    </ThemedText>
  );
}

function Detail({ children }: { children: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.detail}>
      {children}
    </ThemedText>
  );
}

function WifiRow({ now }: { now: number }) {
  const wifi = useEntity(ENTITIES.phone.wifi);
  // without a configured home network, the network's name is the best there is
  if (!HOME_WIFI_NETWORK) {
    const connected = !wifi.isUnavailable && wifi.state !== '<not connected>' && wifi.state !== 'unknown';
    return (
      <InfoRow icon={{ ios: 'wifi', android: 'wifi', web: 'wifi' }} label="Mobile Wi-Fi">
        <Value color={connected ? 'text' : 'danger'}>{connected ? wifi.state : 'Disconnected'}</Value>
      </InfoRow>
    );
  }

  const atHome = wifi.state === HOME_WIFI_NETWORK;
  return (
    <InfoRow
      icon={{ ios: 'wifi', android: 'wifi', web: 'wifi' }}
      label="Mobile Wi-Fi"
      detail={atHome ? <Detail>{`On ${wifi.state} since ${relativePast(wifi.lastChanged, now)}`}</Detail> : undefined}>
      <Value color={atHome ? 'success' : 'danger'}>{atHome ? 'Connected' : 'Disconnected'}</Value>
    </InfoRow>
  );
}

function ProcessorRow() {
  const usage = useReading(ENTITIES.system.cpuUsage);
  const temperature = useReading(ENTITIES.system.cpuTemperature);

  return (
    <InfoRow icon={{ ios: 'gauge.with.dots.needle.33percent', android: 'speed', web: 'speed' }} label="RPi processor">
      <Value color={usage.value > PROC_USAGE_ALERT ? 'danger' : undefined}>{usage.text}</Value>
      <ThemedText type="small" themeColor="textSecondary">
        at
      </ThemedText>
      <Value color={temperature.value > PROC_TEMP_ALERT ? 'danger' : undefined}>{temperature.text}</Value>
    </InfoRow>
  );
}

function MemoryRow() {
  const memory = useReading(ENTITIES.system.memoryUsage);
  return (
    <InfoRow icon={{ ios: 'memorychip', android: 'memory', web: 'memory' }} label="RPi memory">
      <Value color={memory.value > MEM_USAGE_ALERT ? 'danger' : undefined}>{memory.text}</Value>
    </InfoRow>
  );
}

function UptimeRow({ now }: { now: number }) {
  // the sensor's state is the boot time
  const { state } = useEntity(ENTITIES.system.uptime);
  const since = new Date(state);
  const valid = !Number.isNaN(since.getTime());

  return (
    <InfoRow icon={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }} label="Uptime">
      <Value>{valid ? formatDuration(now - since.getTime()) : '–'}</Value>
    </InfoRow>
  );
}

function BackupRow({ backup, states, now }: { backup: SystemEntities['backup']; states: Map<string, EntityState>; now: number }) {
  if (!backup.lastSuccessfulId) return null;
  const last = states.get(backup.lastSuccessfulId);
  const next = backup.nextScheduledId ? states.get(backup.nextScheduledId) : undefined;
  const manager = backup.managerStateId ? states.get(backup.managerStateId) : undefined;

  const lastDate = isAvailable(last) ? new Date(last!.state) : null;
  const tooOld = !lastDate || now - lastDate.getTime() > BACKUP_AGE_ALERT_DAYS * 24 * 60 * 60 * 1000;
  const running = isAvailable(manager) && manager!.state !== 'idle';

  return (
    <InfoRow
      icon={{ ios: 'externaldrive.badge.timemachine', android: 'backup', web: 'backup' }}
      label="Last backup"
      detail={isAvailable(next) ? <Detail>{`Next backup ${relativeFuture(next!.state, now)}`}</Detail> : undefined}>
      {running ? (
        <Value>Backing up…</Value>
      ) : (
        <Value color={tooOld ? 'danger' : undefined}>{lastDate ? relativePast(lastDate, now) : 'None yet'}</Value>
      )}
    </InfoRow>
  );
}

function UpdatesRow({ updateIds, states }: { updateIds: string[]; states: Map<string, EntityState> }) {
  const pending = updateIds.map((id) => states.get(id)).filter((u): u is EntityState => u?.state === 'on');
  const installable = pending.filter((u) => !u.attributes.in_progress).map((u) => u.entity_id);
  const { callService } = useServiceCall();
  const { run, pending: installing } = useAction(
    () => callService('update', 'install', { entity_id: installable }),
    'install the updates',
  );

  if (!pending.length) {
    return (
      <InfoRow icon={{ ios: 'arrow.up.circle', android: 'upgrade', web: 'upgrade' }} label="Updates">
        <Value>Up to date</Value>
      </InfoRow>
    );
  }

  const count = `${installable.length} update${installable.length === 1 ? '' : 's'}`;
  const install = async () => {
    if (await confirm(`Install ${count}?`, 'Some updates restart Home Assistant or its add-ons.', 'Install')) {
      void run();
    }
  };

  return (
    <InfoRow
      icon={{ ios: 'arrow.up.circle', android: 'upgrade', web: 'upgrade' }}
      label="Updates"
      detail={
        <View style={styles.updates}>
          {pending.map((update) => (
            <Detail key={update.entity_id}>
              {`${String(update.attributes.title ?? update.attributes.friendly_name ?? update.entity_id)} ${String(update.attributes.latest_version ?? '?')}${update.attributes.in_progress ? ' (updating…)' : ''}`}
            </Detail>
          ))}
        </View>
      }>
      <Value color="warning">{`${pending.length} available`}</Value>
      {installable.length > 0 && (
        <TextButton label="Install" accessibilityLabel={`Install ${count}`} pending={installing} onPress={() => void install()} />
      )}
    </InfoRow>
  );
}

function RestartRow() {
  const pendingFor = usePendingRestart();
  const { callService } = useServiceCall();
  const { run, pending: restarting } = useAction(() => callService('homeassistant', 'restart'), 'restart Home Assistant');

  if (!pendingFor.length) return null;

  const restart = async () => {
    if (await confirm('Restart Home Assistant?', 'It will be unreachable for a minute or two.', 'Restart')) {
      void run();
    }
  };

  return (
    <InfoRow
      icon={{ ios: 'power', android: 'power_settings_new', web: 'power_settings_new' }}
      label="Restart"
      detail={<Detail>{`Required by ${pendingFor.join(', ')}`}</Detail>}>
      <Value color="warning">Pending</Value>
      <TextButton label="Restart" accessibilityLabel="Restart Home Assistant" pending={restarting} onPress={() => void restart()} />
    </InfoRow>
  );
}

function DiscoveredRows({ entities, now }: { entities: SystemEntities; now: number }) {
  const ids = [...entities.updateIds, ...Object.values(entities.backup).filter((id): id is string => !!id)];
  const states = new Map(useEntityGroup(ids).map((e) => [e.entity_id, e]));

  return (
    <>
      <BackupRow backup={entities.backup} states={states} now={now} />
      <UpdatesRow updateIds={entities.updateIds} states={states} />
    </>
  );
}

export function System() {
  const { entities, error } = useSystemDiscovery();
  // one clock for the card's relative times
  const now = useNow(60_000);

  return (
    <Card icon={SECTIONS.system.icon} title={SECTIONS.system.title}>
      <View style={styles.rows}>
        <WifiRow now={now} />
        <ProcessorRow />
        <MemoryRow />
        <UptimeRow now={now} />
        {entities && <DiscoveredRows entities={entities} now={now} />}
        <RestartRow />
        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  rows: { gap: Spacing.two },
  tabular: { fontVariant: ['tabular-nums'] },
  // lined up with the label, past the row's icon
  detail: { fontSize: 12, lineHeight: 16, paddingLeft: 16 + Spacing.two },
  updates: { gap: Spacing.half },
});
