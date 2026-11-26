import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useEntityGroup, useServiceCall } from 'hass-react';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Collapsible } from '@/components/collapsible';
import type { EntityIcon } from '@/components/ha/entity-button';
import { TextButton } from '@/components/text-button';
import { ThemedText } from '@/components/themed-text';
import { ENTITIES } from '@/constants/entities';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import {
  CALIBRATION_DURATION,
  LOCK_ANGLE,
  MIN_TARGET_SEPARATION,
  usePointer,
  type PointerTarget,
} from '@/hooks/use-pointer';
import { useTheme } from '@/hooks/use-theme';
import { describeAim, headingBetween, type Aim } from '@/lib/pointing';
import { loadCalibration, saveCalibration } from '@/lib/pointing-storage';

const ICON: EntityIcon = { ios: 'scope', android: 'my_location', web: 'my_location' };
const INDICATOR_SIZE = 140;

interface Target {
  /** the calibration's storage key - changing it forgets the saved direction */
  id: string;
  name: string;
  /** toggled together: all off if any is on, otherwise all on */
  entities: string[];
}

/* what you can point at - one per side of the living room */
const TARGETS: Target[] = [
  {
    id: ENTITIES.lights.livingRoom, name: 'Living room + PC lights', entities: [
      ENTITIES.lights.livingRoom, ENTITIES.lights.pcDesk
    ]
  },
  {
    id: 'entrance', name: 'Entrance light', entities: [
      ENTITIES.lights.entrance
    ]
  },
  {
    id: 'tv-stand', name: 'TV stand', entities: [
      ENTITIES.lights.tvStand, ENTITIES.tv.remote
    ]
  },
  {
    id: 'bedside-stairs', name: 'Bedside light + lava lamp', entities: [
      ENTITIES.lights.bedside, ENTITIES.lights.stairs
    ]
  },
];
const ALL_ENTITIES = TARGETS.flatMap((t) => t.entities);

type Calibrations = Record<string, Aim | null>;
const loadAll = (): Calibrations => Object.fromEntries(TARGETS.map((t) => [t.id, loadCalibration(t.id)]));

/**
 * point the phone (top edge first) at one of the TARGETS, then twist the wrist to toggle it.
 * calibrate each once from where you usually stand
 */
export function Pointer() {
  const theme = useTheme();
  const { callService } = useServiceCall();
  const states = useEntityGroup(ALL_ENTITIES);
  const [calibrations, setCalibrations] = useState(loadAll);
  const [calibratingId, setCalibratingId] = useState<string | null>(null);
  const [lastTwist, setLastTwist] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  // the indicator is the trigger: hold it to freeze the lock, twist while holding to toggle
  const [held, setHeld] = useState(false);

  // the sensors only run while this tab is on screen
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const isOn = (entityId: string) => states.find((s) => s.entity_id === entityId)?.state === 'on';
  const anyOn = (target: Target) => target.entities.some(isOn);
  const isUnavailable = (target: Target) =>
    target.entities.every((id) => {
      const state = states.find((s) => s.entity_id === id)?.state;
      return state === undefined || state === 'unavailable';
    });

  // homeassistant.turn_on/off works across domains, so a light and a switch go in one call
  const toggle = useAction(
    (target: Target, on: boolean) =>
      callService('homeassistant', on ? 'turn_on' : 'turn_off', { entity_id: target.entities }),
    (target, on) => `turn ${on ? 'on' : 'off'} the ${target.name.toLowerCase()}`,
    // a twist at a different target shouldn't wait for the last call
    { exclusive: false },
  );

  // while calibrating there are no targets - nothing can lock on, so nothing fires
  const pointerTargets: PointerTarget[] = calibratingId
    ? []
    : TARGETS.flatMap((t) => (calibrations[t.id] ? [{ id: t.id, aim: calibrations[t.id]! }] : []));

  const { available, aim, lockedId, sampleAim } = usePointer({
    enabled: focused,
    targets: pointerTargets,
    held,
    onTwist: (_direction, targetId) => {
      const target = TARGETS.find((t) => t.id === targetId);
      if (!target) return;
      const on = !anyOn(target);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastTwist(`${target.name} → ${on ? 'on' : 'off'}`);
      void toggle.run(target, on);
    },
    onLockChange: (id) => {
      if (id) void Haptics.selectionAsync();
    },
  });

  const calibrate = async (target: Target) => {
    setCalibratingId(target.id);
    const sampled = await sampleAim();
    setCalibratingId(null);
    if (sampled) {
      saveCalibration(target.id, sampled);
      setCalibrations((prev) => ({ ...prev, [target.id]: sampled }));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const reset = (target: Target) => {
    saveCalibration(target.id, null);
    setCalibrations((prev) => ({ ...prev, [target.id]: null }));
  };

  if (available === null) {
    return (
      <Card icon={ICON} title="Point & twist">
        <ActivityIndicator style={styles.loading} />
      </Card>
    );
  }

  if (!available) {
    return (
      <Card icon={ICON} title="Point & twist">
        <ThemedText type="small" themeColor="textSecondary">
          This device has no gyroscope, accelerometer, or compass, so pointing does not work here. Try it on your phone.
        </ThemedText>
      </Card>
    );
  }

  const locked = TARGETS.find((t) => t.id === lockedId) ?? null;
  const calibrating = TARGETS.find((t) => t.id === calibratingId) ?? null;
  const { heading } = aim ? describeAim(aim) : { heading: null };
  const anyCalibrated = TARGETS.some((t) => calibrations[t.id]);

  let status: string;
  if (calibrating) status = `Hold still, pointing at the ${calibrating.name.toLowerCase()}…`;
  else if (!anyCalibrated) status = 'Nothing calibrated yet';
  else if (held && locked) status = `Twist to toggle the ${locked.name.toLowerCase()}`;
  else if (held) status = 'Aim at a device…';
  else if (locked) status = `${locked.name} - hold the circle and twist`;
  else status = 'Point at a device';

  return (
    <Card icon={ICON} title="Point & twist">
      <View style={styles.container}>
        <View style={styles.center}>
          <Pressable
            onPressIn={() => {
              setHeld(true);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onPressOut={() => setHeld(false)}
            disabled={calibratingId !== null}
            accessibilityRole="button"
            accessibilityState={{ selected: held }}
            accessibilityLabel={status}
            accessibilityHint="Hold, then turn your wrist to toggle the device"
            style={[
              styles.indicator,
              {
                borderColor: locked ? theme.success : held ? theme.textSecondary : theme.backgroundSelected,
                backgroundColor: locked || held ? theme.backgroundSelected : 'transparent',
              },
              held && styles.indicatorHeld,
            ]}>
            {locked ? (
              <>
                <ThemedText type="smallBold" style={styles.centerText}>
                  {locked.name}
                </ThemedText>
                <ThemedText type="small" themeColor={anyOn(locked) ? 'success' : 'textSecondary'}>
                  {isUnavailable(locked) ? 'unavailable' : anyOn(locked) ? 'on' : 'off'}
                </ThemedText>
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.tabular}>
                {heading !== null ? `${Math.round(heading)}°` : '…'}
              </ThemedText>
            )}
          </Pressable>
          <ThemedText type="smallBold" themeColor={locked ? 'success' : 'text'}>
            {status}
          </ThemedText>
          {lastTwist && (
            <ThemedText type="small" themeColor="textSecondary">
              {lastTwist}
            </ThemedText>
          )}
        </View>

        <Collapsible isOpen={open} onOpenChange={setOpen} label="Configuration">
          <View style={styles.list}>
            {TARGETS.map((target) => {
              const calibration = calibrations[target.id];
              // compass heading only - pointing higher or lower doesn't matter. Infinity when pointing straight up/down
              const headingOff = aim && calibration ? headingBetween(aim, calibration) : null;
              const off = headingOff !== null && Number.isFinite(headingOff) ? Math.round(headingOff) : null;
              // another calibration this close can't be told apart from this one
              const tooClose = calibration
                ? TARGETS.find((other) => {
                  const otherCalibration = calibrations[other.id];
                  return (
                    other.id !== target.id &&
                    otherCalibration &&
                    headingBetween(calibration, otherCalibration) < MIN_TARGET_SEPARATION
                  );
                })
                : undefined;

              return (
                <View key={target.id} style={styles.row}>
                  <View style={styles.rowText}>
                    <ThemedText type="small" themeColor={target.id === lockedId ? 'success' : 'text'}>
                      {target.name}
                      <ThemedText type="small" themeColor={anyOn(target) ? 'success' : 'textSecondary'}>
                        {'  '}
                        {isUnavailable(target) ? 'unavailable' : anyOn(target) ? 'on' : 'off'}
                      </ThemedText>
                    </ThemedText>
                    <ThemedText type="small" themeColor={tooClose ? 'warning' : 'textSecondary'} style={styles.tabular}>
                      {!calibration
                        ? 'Not calibrated'
                        : tooClose
                          ? `Too close to ${tooClose.name.toLowerCase()} - recalibrate one`
                          : off !== null
                            ? `${off}° away`
                            : 'Calibrated'}
                    </ThemedText>
                  </View>
                  {calibration && !calibratingId && (
                    <TextButton label="Reset" onPress={() => reset(target)} accessibilityLabel={`Forget the ${target.name.toLowerCase()} calibration`} />
                  )}
                  <TextButton
                    label={calibration ? 'Recalibrate' : 'Calibrate'}
                    pending={calibratingId === target.id}
                    disabled={calibratingId !== null && calibratingId !== target.id}
                    onPress={() => void calibrate(target)}
                    accessibilityLabel={`Calibrate the direction of the ${target.name.toLowerCase()}`}
                  />
                </View>
              );
            })}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {`Calibrate each device from where you usually stand: point the top of the phone at it, tap Calibrate, and hold still for ${CALIBRATION_DURATION / 1000}s. Then point at one (within ${LOCK_ANGLE}°) until it buzzes, hold the circle, and quickly turn your wrist to toggle it. While you hold, it stays locked on to that device.`}
          </ThemedText>
        </Collapsible>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: Spacing.four },
  container: { gap: Spacing.five },
  center: { alignItems: 'center', gap: Spacing.two },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  /* pressed in, like a button */
  indicatorHeld: { transform: [{ scale: 0.95 }] },
  centerText: { textAlign: 'center' },
  list: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowText: { flex: 1, gap: Spacing.half },
  tabular: { fontVariant: ['tabular-nums'] },
});
