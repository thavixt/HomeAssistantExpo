import { useScene } from 'hass-react';

import { EntityButton, type EntityIcon } from '@/components/ha/entity-button';
import { useAction } from '@/hooks/use-action';

export function Scene({ id, name, icon }: { id: string; name?: string; icon: EntityIcon }) {
  const { activate, attributes, state, isUnavailable } = useScene(id);
  const displayName = name ?? attributes.friendly_name ?? id;
  const { run, pending } = useAction(() => activate(), `activate the "${displayName}" scene`);

  return (
    <EntityButton
      icon={icon}
      label={displayName}
      pending={pending}
      loading={state === 'unknown'}
      unavailable={isUnavailable}
      onPress={() => void run()}
      accessibilityLabel={`Activate "${displayName}" scene`}
    />
  );
}
