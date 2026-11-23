import { useEntity } from 'hass-react';

import { EntityButton, type EntityIcon } from '@/components/ha/entity-button';
import { useAction } from '@/hooks/use-action';
import { relativePast } from '@/lib/time';

/** toggles whether an automation is enabled - it doesn't trigger it. `now` drives the "last triggered" line */
export function Automation({ id, name, icon, now }: { id: string; name?: string; icon?: EntityIcon; now: number }) {
  const { state, attributes, callService, isUnavailable } = useEntity(id);
  const isOn = state === 'on';
  const displayName = name ?? (attributes.friendly_name as string | undefined) ?? id;
  const lastTriggered = attributes.last_triggered as string | null | undefined;
  const ago = lastTriggered ? relativePast(lastTriggered, now) : 'never';

  const { run, pending } = useAction(
    () => callService('automation', isOn ? 'turn_off' : 'turn_on', { entity_id: id }),
    `turn ${isOn ? 'off' : 'on'} the "${displayName}" automation`,
  );

  return (
    <EntityButton
      icon={icon}
      label={displayName}
      detail={`Last ran ${ago}`}
      active={isOn}
      pending={pending}
      loading={state === 'unknown'}
      unavailable={isUnavailable}
      onPress={() => void run()}
      accessibilityLabel={`${isOn ? 'Disable' : 'Enable'} the "${displayName}" automation, last triggered ${ago}`}
      accessibilityChecked={isOn}
    />
  );
}
