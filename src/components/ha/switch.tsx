import { useSwitch } from 'hass-react';

import { EntityButton, type EntityIcon } from '@/components/ha/entity-button';
import { useAction } from '@/hooks/use-action';

export function Switch({
  id,
  name,
  icon,
  onPress,
}: {
  id: string;
  name?: string;
  icon: EntityIcon;
  /** replaces the default toggle, like the pwa's `onClick` */
  onPress?: () => Promise<unknown>;
}) {
  const { isOn, toggle, attributes, state, isUnavailable } = useSwitch(id);
  const displayName = name ?? (attributes.friendly_name as string | undefined) ?? id;
  const { run, pending } = useAction(onPress ?? toggle, `turn ${isOn ? 'off' : 'on'} ${displayName}`);

  return (
    <EntityButton
      icon={icon}
      label={displayName}
      active={isOn}
      pending={pending}
      loading={state === 'unknown'}
      unavailable={isUnavailable}
      onPress={() => void run()}
      accessibilityLabel={`Turn ${isOn ? 'off' : 'on'} ${displayName} switch`}
      accessibilityChecked={isOn}
    />
  );
}
