import { SymbolView } from 'expo-symbols';
import { useEntityGroup } from 'hass-react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Card, CardPlaceholder } from '@/components/card';
import type { EntityIcon } from '@/components/ha/entity-button';
import { TextButton } from '@/components/text-button';
import { ThemedText } from '@/components/themed-text';
import { ENTITIES } from '@/constants/entities';
import { Spacing } from '@/constants/theme';
import { entryKey, useLogbook, type LogbookEntry } from '@/hooks/use-logbook';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { SECTIONS } from '@/lib/sections';
import { formatTime, relativePast } from '@/lib/time';

const { title: TITLE, icon: ICON } = SECTIONS.activity;

/* only the entities shown in the app, the same as in the pwa - the full logbook is too noisy */
const ENTITY_IDS: string[] = [
  ENTITIES.lights.livingRoom,
  ENTITIES.lights.bedside,
  ENTITIES.lights.entrance,
  ENTITIES.lights.tvStand,
  ENTITIES.lights.pcDesk,
  ENTITIES.lights.stairs,
  ENTITIES.ac.climate,
  ENTITIES.tv.mediaPlayer,
  ENTITIES.scenes.lightsOff,
  ENTITIES.scenes.nightLights,
  ENTITIES.scenes.sleepMode,
  ENTITIES.scenes.vibes,
  ENTITIES.automations.homeEnter,
  ENTITIES.automations.homeLeaving,
  ENTITIES.automations.homeAfternoonLights,
  ENTITIES.automations.dashboardsBatteryLow,
  ENTITIES.automations.phoneSleepReminder,
  ENTITIES.automations.turnOnTv,
  ENTITIES.automations.turnOffTvAtMidnight,
];

const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_ICON: EntityIcon = { ios: 'waveform.path.ecg', android: 'timeline', web: 'timeline' };
const DOMAIN_ICONS: Record<string, EntityIcon> = {
  automation: { ios: 'gearshape.2', android: 'auto_mode', web: 'auto_mode' },
  climate: { ios: 'air.conditioner.horizontal', android: 'ac_unit', web: 'ac_unit' },
  light: { ios: 'lightbulb', android: 'lightbulb', web: 'lightbulb' },
  media_player: { ios: 'tv', android: 'tv', web: 'tv' },
  scene: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  script: { ios: 'scroll', android: 'description', web: 'description' },
  switch: { ios: 'powerplug', android: 'power', web: 'power' },
};

/* nicer names for some entities in messages, e.g. "triggered by state of phone sensor" */
const MESSAGE_NAMES: Record<string, string> = {
  [ENTITIES.phone.wifi]: 'phone sensor',
  [ENTITIES.phone.nextAlarm]: 'phone alarm',
};

/* entity ids inside logbook messages, e.g. "triggered by state of binary_sensor.phone" */
const ENTITY_ID_PATTERN = /\b[a-z_]+\.[a-z0-9_]+\b/g;

type NameResolver = (entityId: string | undefined) => string | undefined;

/* logbook times are unix seconds */
const toDate = (when: number) => new Date(when * 1000);

/* older entries show the time of day - the day itself is in the separator above them */
const formatWhen = (when: number, now: number) => {
  const date = toDate(when);
  return now - date.getTime() < DAY_MS ? relativePast(date, now) : formatTime(date);
};

const formatDay = (when: number) =>
  toDate(when).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

const startsNewDay = (entries: LogbookEntry[], i: number) =>
  i > 0 && toDate(entries[i].when).toDateString() !== toDate(entries[i - 1].when).toDateString();

/** the entities an entry refers to besides its own - what caused it, and any its message mentions */
const relatedIds = (entry: LogbookEntry) =>
  [entry.context_entity_id, ...(entry.message?.match(ENTITY_ID_PATTERN) ?? [])].filter((id): id is string => !!id);

const nameOf = (entry: LogbookEntry, friendlyName: NameResolver) =>
  friendlyName(entry.entity_id) ?? entry.name ?? entry.entity_id ?? 'Home Assistant';

/** the automation or script that caused it, if it wasn't the entity itself */
const causeOf = (entry: LogbookEntry, friendlyName: NameResolver) =>
  entry.context_name && entry.context_entity_id !== entry.entity_id
    ? (friendlyName(entry.context_entity_id) ?? entry.context_name)
    : undefined;

const describeState = (state: string) => {
  if (state === 'on' || state === 'off') return `turned ${state}`;
  if (state === 'unavailable') return 'became unavailable';
  return `changed to "${state.replaceAll('_', ' ')}"`;
};

const describeEntry = (entry: LogbookEntry, domain: string, friendlyName: NameResolver) => {
  if (entry.message) {
    // the fixed names win, otherwise the entity's friendly name - unknown ids stay as they are
    return entry.message.replace(ENTITY_ID_PATTERN, (id) => MESSAGE_NAMES[id] ?? friendlyName(id) ?? id);
  }
  // a scene's state is the timestamp of its last activation
  if (domain === 'scene') return 'activated';
  return entry.state ? describeState(entry.state) : 'changed';
};

function ActivityRow({ entry, friendlyName, now }: { entry: LogbookEntry; friendlyName: NameResolver; now: number }) {
  const theme = useTheme();
  const domain = entry.domain ?? entry.entity_id?.split('.')[0] ?? '';
  const cause = causeOf(entry, friendlyName);

  return (
    // read as one sentence by screen readers
    <View style={styles.row} accessible>
      <View style={styles.icon}>
        <SymbolView name={DOMAIN_ICONS[domain] ?? DEFAULT_ICON} size={16} tintColor={theme.textSecondary} />
      </View>
      <ThemedText type="small" style={styles.text}>
        <ThemedText type="smallBold">{nameOf(entry, friendlyName)}</ThemedText>{' '}
        {describeEntry(entry, domain, friendlyName)}
        {cause && ` by ${cause}`}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.tabular}>
        {formatWhen(entry.when, now)}
      </ThemedText>
    </View>
  );
}

function DaySeparator({ when }: { when: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.day, { borderBottomColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {formatDay(when)}
      </ThemedText>
    </View>
  );
}

export function ActivityLog() {
  const { entries, error, loading, loadingMore, hasMore, loadMore } = useLogbook(ENTITY_IDS, { pageSize: PAGE_SIZE });
  // related entities may be outside ENTITY_IDS - subscribe to them too, for their names
  const entities = useEntityGroup([...ENTITY_IDS, ...entries.flatMap(relatedIds)]);
  // one clock for the whole card, so every "5m ago" moves on together
  const now = useNow(30_000);

  if (loading) {
    return <CardPlaceholder icon={ICON} title={TITLE} />;
  }

  const names = new Map(entities.map((e) => [e.entity_id, e.attributes.friendly_name as string | undefined]));
  const friendlyName: NameResolver = (entityId) => (entityId ? names.get(entityId) : undefined);

  return (
    <Card icon={ICON} title={TITLE} shrink>
      <FlatList
        data={entries}
        keyExtractor={entryKey}
        renderItem={({ item, index }) => (
          <>
            {startsNewDay(entries, index) && <DaySeparator when={item.when} />}
            <ActivityRow entry={item} friendlyName={friendlyName} now={now} />
          </>
        )}
        ListEmptyComponent={
          error ? undefined : (
            <ThemedText type="small" themeColor="textSecondary">
              {hasMore ? 'No activity in the last 24 hours.' : 'No activity.'}
            </ThemedText>
          )
        }
        ListFooterComponent={
          <>
            {error && (
              <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
                {error}
              </ThemedText>
            )}
            {hasMore && (
              <TextButton
                label="Load more"
                accessibilityLabel="Load older activity"
                pending={loadingMore}
                onPress={() => void loadMore()}
              />
            )}
          </>
        }
        ListFooterComponentStyle={styles.footer}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        // always visible on android, so it's clear there's more to scroll to
        persistentScrollbar
        // the card is dark
        indicatorStyle="white"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  // as tall as its rows, until the card fills the screen
  list: { flexGrow: 0, flexShrink: 1, marginRight: -Spacing.two },
  // the scrollbar goes next to the rows, rather than over their times
  listContent: { gap: Spacing.two, paddingRight: Spacing.three },
  footer: { gap: Spacing.two, marginTop: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  // centered on the text's first line
  icon: { height: 20, justifyContent: 'center' },
  text: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  day: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    paddingBottom: Spacing.one,
    borderBottomWidth: 1,
  },
});
