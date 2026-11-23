import { useEntity, useServiceCall } from 'hass-react';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardPlaceholder } from '@/components/card';
import { ChipGroup } from '@/components/chip-group';
import { Cell, Grid } from '@/components/grid';
import type { EntityIcon } from '@/components/ha/entity-button';
import { Script } from '@/components/ha/script';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ENTITIES, objectId } from '@/constants/entities';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useTheme } from '@/hooks/use-theme';

const TITLE = 'Vidaa TV';
const ICON: EntityIcon = { ios: 'tv', android: 'tv', web: 'tv' };

/* volume cap (percent) for both the bar and the + button */
const MAX_VOLUME = 20;

const SELECTABLE_APPS_MATCH = ['tv browser', 'home', 'unavailable', 'weather', 'youtube'];

interface RemoteKey {
  command: string;
  label: string;
  icon?: EntityIcon;
}

/* Vidaa (Hisense) remote key codes - KEY_RETURNS is "back", KEY_BACK is rewind */
const KEY = {
  up: { command: 'KEY_UP', label: 'Up', icon: { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' } },
  down: { command: 'KEY_DOWN', label: 'Down', icon: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' } },
  left: { command: 'KEY_LEFT', label: 'Left', icon: { ios: 'chevron.left', android: 'keyboard_arrow_left', web: 'keyboard_arrow_left' } },
  right: { command: 'KEY_RIGHT', label: 'Right', icon: { ios: 'chevron.right', android: 'keyboard_arrow_right', web: 'keyboard_arrow_right' } },
  ok: { command: 'KEY_OK', label: 'OK' },
  back: { command: 'KEY_RETURNS', label: 'Back', icon: { ios: 'arrow.uturn.backward', android: 'undo', web: 'undo' } },
  home: { command: 'KEY_HOME', label: 'Home', icon: { ios: 'house', android: 'home', web: 'home' } },
  menu: { command: 'KEY_MENU', label: 'Menu', icon: { ios: 'line.3.horizontal', android: 'menu', web: 'menu' } },
  exit: { command: 'KEY_EXIT', label: 'Exit', icon: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' } },
  rewind: { command: 'KEY_BACK', label: 'Rewind', icon: { ios: 'backward.fill', android: 'fast_rewind', web: 'fast_rewind' } },
  play: { command: 'KEY_PLAY', label: 'Play', icon: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' } },
  pause: { command: 'KEY_PAUSE', label: 'Pause', icon: { ios: 'pause.fill', android: 'pause', web: 'pause' } },
  forward: { command: 'KEY_FORWARDS', label: 'Fast forward', icon: { ios: 'forward.fill', android: 'fast_forward', web: 'fast_forward' } },
} satisfies Record<string, RemoteKey>;

const MINUS: EntityIcon = { ios: 'minus', android: 'remove', web: 'remove' };
const PLUS: EntityIcon = { ios: 'plus', android: 'add', web: 'add' };
const MUTE: EntityIcon = { ios: 'speaker.slash', android: 'volume_off', web: 'volume_off' };

const KEY_SIZE = 52;

function RemoteSheet({
  open,
  onClose,
  sendKey,
  volume,
  setVolume,
  off,
}: {
  open: boolean;
  onClose: () => void;
  sendKey: (command: string) => void;
  /* volume goes through the card's volume_set, not KEY_VOLUMEUP, so MAX_VOLUME still holds */
  volume: number;
  setVolume: (volume: number) => void;
  off: boolean;
}) {
  const insets = useSafeAreaInsets();
  const key = ({ command, label, icon }: RemoteKey) => (
    <IconButton key={command} icon={icon} text={label} label={label} size={KEY_SIZE} onPress={() => sendKey(command)} />
  );
  const blank = <View style={styles.blank} />;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close the remote" />
      <ThemedView style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.sheetHeader}>
          <View>
            <ThemedText type="smallBold">Remote</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {TITLE}
            </ThemedText>
          </View>
          <IconButton icon={{ ios: 'xmark', android: 'close', web: 'close' }} label="Close the remote" onPress={onClose} />
        </View>

        <View style={styles.remoteMain}>
          <View style={styles.dpad}>
            <View style={styles.keyRow}>{blank}{key(KEY.up)}{blank}</View>
            <View style={styles.keyRow}>{key(KEY.left)}{key(KEY.ok)}{key(KEY.right)}</View>
            <View style={styles.keyRow}>{blank}{key(KEY.down)}{blank}</View>
          </View>
          <View style={styles.volumeColumn}>
            <IconButton icon={PLUS} label="Increase volume" size={KEY_SIZE} disabled={off || volume >= MAX_VOLUME} onPress={() => setVolume(Math.min(volume + 1, MAX_VOLUME))} />
            <ThemedText type="small" style={styles.tabular}>{volume}%</ThemedText>
            <IconButton icon={MINUS} label="Decrease volume" size={KEY_SIZE} disabled={off || volume <= 0} onPress={() => setVolume(volume - 1)} />
            <IconButton icon={MUTE} label="Mute volume" size={KEY_SIZE} disabled={off} onPress={() => setVolume(0)} />
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary">Media controls</ThemedText>
        <View style={styles.keyRow}>{key(KEY.rewind)}{key(KEY.play)}{key(KEY.pause)}{key(KEY.forward)}</View>
        <ThemedText type="small" themeColor="textSecondary">Device controls</ThemedText>
        <View style={styles.keyRow}>{key(KEY.back)}{key(KEY.home)}{key(KEY.menu)}{key(KEY.exit)}</View>
      </ThemedView>
    </Modal>
  );
}

function VolumeBar({ volume }: { volume: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.barFill, { width: `${Math.min(volume / MAX_VOLUME, 1) * 100}%`, backgroundColor: theme.text }]} />
    </View>
  );
}

export function TV() {
  const { callService } = useServiceCall();
  const { isUnavailable, state, callService: callRemoteService } = useEntity(ENTITIES.tv.remote);
  const { callService: callTVService, attributes } = useEntity(ENTITIES.tv.mediaPlayer);
  const off = state === 'off';

  const sourceList = (attributes.source_list ?? []) as string[];
  const apps = sourceList
    .filter((source) => SELECTABLE_APPS_MATCH.some((app) => source.toLowerCase().includes(app)))
    .map((value) => ({ label: value, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // local copies, so the UI moves right away - reset whenever the TV reports a new value
  // (adjusted during render rather than in an effect, which would render twice)
  const currentSource = (attributes.app_name as string | undefined) ?? 'Unavailable';
  const [currentApp, setCurrentApp] = useState(currentSource);
  const [prevSource, setPrevSource] = useState(currentSource);
  if (currentSource !== prevSource) {
    setPrevSource(currentSource);
    setCurrentApp(currentSource);
  }

  const reportedVolume = (attributes.volume_level as number | undefined) ?? 0;
  const [volumeLevel, setVolumeLevel] = useState(reportedVolume);
  const [prevVolume, setPrevVolume] = useState(reportedVolume);
  if (reportedVolume !== prevVolume) {
    setPrevVolume(reportedVolume);
    setVolumeLevel(reportedVolume);
  }
  const volume = Math.round(volumeLevel * 100);

  // not exclusive: every volume step counts, the local value already moved
  const volumeAction = useAction(
    (level: number) => callTVService('media_player', 'volume_set', { volume_level: level }),
    (level) => `set the TV volume to ${Math.round(level * 100)}%`,
    { exclusive: false },
  );
  /** set volume from 0-100 */
  const setVolume = (percent: number) => {
    const level = +Number(Math.max(0, percent) / 100).toFixed(2);
    setVolumeLevel(level);
    void volumeAction.run(level);
  };

  const app = useAction(
    (source: string) => callTVService('media_player', 'select_source', { source }),
    (source) => `open ${source} on the TV`,
  );
  const setApp = (source: string) => {
    setCurrentApp(source);
    void app.run(source);
  };

  const [remoteOpen, setRemoteOpen] = useState(false);
  // not exclusive: every key press counts, e.g. pressing down three times in a menu
  const remoteKey = useAction(
    (command: string) => callRemoteService('remote', 'send_command', { command }),
    (command) => `send ${command} to the TV`,
    { exclusive: false },
  );

  const power = useAction(
    () => callService('script', objectId(off ? ENTITIES.scripts.tvOn : ENTITIES.scripts.tvTurnOff)),
    `turn ${off ? 'on' : 'off'} the TV`,
  );

  if (state === 'unknown') {
    return <CardPlaceholder icon={ICON} title={TITLE} />;
  }

  if (isUnavailable) {
    return (
      <Card icon={ICON} title={TITLE}>
        <ThemedText type="small" themeColor="textSecondary">
          The TV is unavailable in Home Assistant.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card
      icon={ICON}
      title={TITLE}
      right={
        <View style={styles.headerButtons}>
          <IconButton
            icon={{ ios: 'gamecontroller', android: 'sports_esports', web: 'sports_esports' }}
            label="Open the remote"
            disabled={off}
            onPress={() => setRemoteOpen(true)}
          />
          <IconButton
            icon={{ ios: 'power', android: 'power_settings_new', web: 'power_settings_new' }}
            label={`Turn ${off ? 'on' : 'off'} ${TITLE} and lights`}
            variant={off ? 'secondary' : 'primary'}
            pending={power.pending}
            onPress={() => void power.run()}
          />
        </View>
      }>
      <ChipGroup label="App" options={apps} value={currentApp} onChange={setApp} disabled={off} pending={app.pending} />

      <View style={styles.volumeRow}>
        <ThemedText type="small" style={[styles.volumeText, styles.tabular]}>
          {volume}%
        </ThemedText>
        <VolumeBar volume={volume} />
        <IconButton icon={MINUS} label="Decrease volume" disabled={off || volume <= 0} onPress={() => setVolume(volume - 1)} />
        <IconButton icon={PLUS} label="Increase volume" disabled={off || volume >= MAX_VOLUME} onPress={() => setVolume(Math.min(volume + 1, MAX_VOLUME))} />
        <IconButton icon={MUTE} label="Mute volume" disabled={off} onPress={() => setVolume(0)} />
      </View>

      <Grid>
        <Cell><Script id={ENTITIES.scripts.playYoutubeVideo} name="Youtube" /></Cell>
        <Cell><Script id={ENTITIES.scripts.dashboardBrowser} name="Dashboard" /></Cell>
        <Cell><Script id={ENTITIES.scripts.lofiStream} name="YT: Chill" /></Cell>
        <Cell><Script id={ENTITIES.scripts.fireplaceStream} name="YT: Fireplace" /></Cell>
      </Grid>

      <RemoteSheet
        open={remoteOpen}
        onClose={() => setRemoteOpen(false)}
        sendKey={(command) => void remoteKey.run(command)}
        volume={volume}
        setVolume={setVolume}
        off={off}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerButtons: { flexDirection: 'row', gap: Spacing.two },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  volumeText: { width: 40, textAlign: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  bar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remoteMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dpad: { gap: Spacing.two },
  keyRow: { flexDirection: 'row', gap: Spacing.two },
  blank: { width: KEY_SIZE, height: KEY_SIZE },
  volumeColumn: { alignItems: 'center', gap: Spacing.two },
});
