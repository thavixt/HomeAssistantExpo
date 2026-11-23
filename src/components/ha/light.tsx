import { useLight } from 'hass-react';

import { EntityButton, type EntityIcon } from '@/components/ha/entity-button';
import { useAction } from '@/hooks/use-action';

export function Light({ id, name, icon }: { id: string; name?: string; icon: EntityIcon }) {
  const { isOn, toggle, attributes, state, isUnavailable } = useLight(id);
  const displayName = name ?? attributes.friendly_name ?? id;
  const { run, pending } = useAction(toggle, `turn ${isOn ? 'off' : 'on'} ${displayName}`);

  return (
    <EntityButton
      icon={icon}
      label={displayName}
      active={isOn}
      pending={pending}
      loading={state === 'unknown'}
      unavailable={isUnavailable}
      onPress={() => void run()}
      accessibilityLabel={`Turn ${isOn ? 'off' : 'on'} ${displayName} light`}
      accessibilityChecked={isOn}
    />
  );
}
