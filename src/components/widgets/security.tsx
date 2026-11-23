import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEntity } from 'hass-react';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ENTITIES } from '@/constants/entities';
import { Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { HA_URL } from '@/lib/ha-config';
import { SECTIONS } from '@/lib/sections';

/* snapshots instead of streams on the card, to save bandwidth - like the pwa */
const SNAPSHOT_INTERVAL_MS = 15 * 60 * 1000;
/* the live view - a new snapshot every second, since RN's image components can't play MJPEG streams */
const LIVE_INTERVAL_MS = 1000;

/**
 * HA proxies the camera, so its own credentials never reach the app. the token is the entity's
 * short-lived access token, which HA rotates every few minutes. `t` busts the cache
 */
const snapshotUrl = (entityId: string, token: string, t: number) =>
  `${HA_URL}/api/camera_proxy/${entityId}?token=${token}&t=${t}`;

type LoadState = 'loading' | 'loaded' | 'error';

function Snapshot({ entityId, token, t, style }: { entityId: string; token: string; t: number; style: object }) {
  const theme = useTheme();
  // only the first image - after that, a refresh keeps showing the previous one until the new one loads
  const [state, setState] = useState<LoadState>('loading');

  return (
    <View style={[styles.frame, style]}>
      <Image
        source={{ uri: snapshotUrl(entityId, token, t) }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        // every url is unique, so caching them would only fill up the disk
        cachePolicy="none"
        onLoad={() => setState('loaded')}
        onError={() => setState((s) => (s === 'loaded' ? s : 'error'))}
      />
      {state !== 'loaded' && (
        <View style={styles.frameOverlay}>
          {state === 'loading' ? (
            <ActivityIndicator color={theme.textSecondary} />
          ) : (
            <SymbolView name={{ ios: 'video.slash', android: 'videocam_off', web: 'videocam_off' }} size={24} tintColor={theme.textSecondary} />
          )}
        </View>
      )}
    </View>
  );
}

/** mounted only while open, so the 1s refresh stops when it's closed */
function LiveView({ entityId, token, name, onClose }: { entityId: string; token: string; name: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const now = useNow(LIVE_INTERVAL_MS);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close the camera" />
      <ThemedView style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.sheetHeader}>
          <View>
            <ThemedText type="smallBold">{name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Live - refreshes every second
            </ThemedText>
          </View>
          <IconButton icon={{ ios: 'xmark', android: 'close', web: 'close' }} label="Close the camera" onPress={onClose} />
        </View>
        <Snapshot entityId={entityId} token={token} t={now} style={styles.live} />
      </ThemedView>
    </Modal>
  );
}

function CameraRow({ entityId, now }: { entityId: string; now: number }) {
  const theme = useTheme();
  const camera = useEntity(entityId);
  const token = camera.attributes.access_token as string | undefined;
  const available = !camera.isUnavailable && !!token;
  const name = String(camera.attributes.friendly_name ?? entityId);
  const [live, setLive] = useState(false);
  // opening the live view refreshes the card's snapshot too, so it's current once it closes
  const [openedAt, setOpenedAt] = useState(0);

  return (
    <View style={styles.row}>
      <View style={styles.name}>
        <SymbolView
          name={available ? { ios: 'video', android: 'videocam', web: 'videocam' } : { ios: 'video.slash', android: 'videocam_off', web: 'videocam_off' }}
          size={20}
          tintColor={available ? theme.success : theme.danger}
        />
        <ThemedText type="small" numberOfLines={2} style={styles.nameText}>
          {name}
        </ThemedText>
      </View>
      {available ? (
        <Pressable
          onPress={() => {
            setOpenedAt(Date.now());
            setLive(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Watch "${name}" live`}
          style={({ pressed }) => pressed && styles.pressed}>
          <Snapshot entityId={entityId} token={token} t={Math.max(now, openedAt)} style={styles.thumbnail} />
        </Pressable>
      ) : (
        <View style={[styles.frame, styles.thumbnail, styles.center]}>
          <ThemedText type="small" themeColor="textSecondary">
            Unavailable
          </ThemedText>
        </View>
      )}
      {live && token && <LiveView entityId={entityId} token={token} name={name} onClose={() => setLive(false)} />}
    </View>
  );
}

export function Security() {
  // one shared tick refreshes every snapshot together
  const now = useNow(SNAPSHOT_INTERVAL_MS);

  return (
    <Card icon={SECTIONS.security.icon} title={SECTIONS.security.title}>
      <View style={styles.list}>
        {Object.values(ENTITIES.security.camera).map((entityId) => (
          <CameraRow key={entityId} entityId={entityId} now={now} />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  name: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexShrink: 1 },
  nameText: { flexShrink: 1 },
  frame: { aspectRatio: 16 / 9, borderRadius: Spacing.two, overflow: 'hidden', backgroundColor: '#000' },
  frameOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  thumbnail: { width: 160 },
  live: { width: '100%' },
  pressed: { opacity: 0.7 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
