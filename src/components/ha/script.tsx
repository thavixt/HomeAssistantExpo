import { useEntity } from 'hass-react';

import { EntityButton, type EntityIcon } from '@/components/ha/entity-button';
import { useAction } from '@/hooks/use-action';

export function Script({ id, name, icon }: { id: string; name?: string; icon?: EntityIcon }) {
  // a script's state is "on" while it's running
  const { state, attributes, callService, isUnavailable } = useEntity(id);
  const displayName = name ?? (attributes.friendly_name as string | undefined) ?? id;
  const { run, pending } = useAction(
    () => callService('script', 'turn_on', { entity_id: id }),
    `run the "${displayName}" script`,
  );

  return (
    <EntityButton
      icon={icon}
      label={displayName}
      active={state === 'on'}
      pending={pending}
      loading={state === 'unknown'}
      unavailable={isUnavailable}
      onPress={() => void run()}
      accessibilityLabel={`Run script "${displayName}"`}
    />
  );
}
