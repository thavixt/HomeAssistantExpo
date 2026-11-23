import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClimate, type ClimateAttributes } from 'hass-react';

import { Card, CardPlaceholder } from '@/components/card';
import { ChipGroup } from '@/components/chip-group';
import type { EntityIcon } from '@/components/ha/entity-button';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useTemperatureUnit } from '@/hooks/use-temperature-unit';
import { ENTITIES } from '@/lib/entities';

const TITLE = 'Gree AC';
const ICON: EntityIcon = { ios: 'air.conditioner.horizontal', android: 'ac_unit', web: 'ac_unit' };

/* nicer labels for some values - anything else is humanized, e.g. "medium_low" -> "Medium low" */
const LABELS: Record<string, string> = {
  fan_only: 'Fan only',
  heat_cool: 'Heat/cool',
  medium_low: 'Low m.',
  medium_high: 'High m.',
};
const toLabel = (value: string) =>
  LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');

/* attributes the Gree reports that hass-react doesn't type */
type GreeAttributes = ClimateAttributes & {
  target_temp_step?: number;
  outside_temperature?: number;
};

/* the options come from the entity, so they always match what the AC actually supports */
const toOptions = (values: string[]) => values.map((value) => ({ label: toLabel(value), value }));

export function Climate() {
  const {
    currentTemperature,
    targetTemperature,
    setTemperature,
    attributes,
    mode,
    fanMode,
    supportedModes,
    supportedFanModes,
    setMode,
    setFanMode,
    minTemp,
    maxTemp,
    state,
    isUnavailable,
  } = useClimate(ENTITIES.ac.climate);
  const unit = useTemperatureUnit();
  const { target_temp_step, outside_temperature } = attributes as GreeAttributes;
  const step = target_temp_step || 1;

  // a local copy, so the number moves right away - reset whenever the AC reports a new target
  // (adjusted during render rather than in an effect, which would render twice)
  const reportedTarget = Number(targetTemperature) || minTemp;
  const [target, setTarget] = useState(reportedTarget);
  const [prevTarget, setPrevTarget] = useState(reportedTarget);
  if (reportedTarget !== prevTarget) {
    setPrevTarget(reportedTarget);
    setTarget(reportedTarget);
  }

  // not exclusive: the number already shows the new value, so a dropped call would leave it wrong
  const temperature = useAction(setTemperature, (t) => `set the temperature to ${t} ${unit}`, { exclusive: false });
  const setTemperatureTo = (t: number) => {
    setTarget(t);
    void temperature.run(t);
  };
  const hvacMode = useAction(setMode, (m) => `set the AC mode to "${m}"`);
  const fan = useAction(setFanMode, (m) => `set the fan mode to "${m}"`);

  if (state === 'unknown') {
    return <CardPlaceholder icon={ICON} title={TITLE} />;
  }

  if (isUnavailable) {
    return (
      <Card icon={ICON} title={TITLE}>
        <ThemedText type="small" themeColor="textSecondary">
          The AC is unavailable in Home Assistant.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card
      icon={ICON}
      title={TITLE}
      right={
        <View style={styles.readings}>
          <ThemedText type="small" themeColor="textSecondary">
            {currentTemperature ?? '–'} {unit} inside
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {outside_temperature ?? '–'} {unit} outside
          </ThemedText>
        </View>
      }>
      <View style={styles.target}>
        <IconButton
          icon={{ ios: 'minus', android: 'remove', web: 'remove' }}
          label="Decrease temperature"
          size={52}
          variant="primary"
          disabled={target - step < minTemp}
          onPress={() => setTemperatureTo(target - step)}
        />
        <View style={styles.targetValue} accessibilityLabel={`Target temperature ${target} ${unit}`}>
          <ThemedText type="subtitle" style={[styles.tabular, temperature.pending && styles.pending]}>
            {target} {unit}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            target
          </ThemedText>
        </View>
        <IconButton
          icon={{ ios: 'plus', android: 'add', web: 'add' }}
          label="Increase temperature"
          size={52}
          variant="primary"
          disabled={target + step > maxTemp}
          onPress={() => setTemperatureTo(target + step)}
        />
      </View>

      <ChipGroup
        label="Mode"
        options={toOptions(supportedModes)}
        value={mode}
        onChange={(m) => void hvacMode.run(m)}
        pending={hvacMode.pending}
      />
      <ChipGroup
        label="Fan"
        options={toOptions(supportedFanModes)}
        value={fanMode}
        onChange={(m) => void fan.run(m)}
        pending={fan.pending}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  readings: { alignItems: 'flex-end' },
  target: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  targetValue: { alignItems: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  pending: { opacity: 0.5 },
});
