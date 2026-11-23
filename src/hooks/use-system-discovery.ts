import { useEffect, useState } from 'react';
import { useHAConnection, type EntityState } from 'hass-react';

export interface SystemEntities {
  updateIds: string[];
  backup: {
    lastSuccessfulId?: string;
    nextScheduledId?: string;
    managerStateId?: string;
  };
}

/* compact entity registry format of "config/entity_registry/list_for_display" */
interface DisplayEntity {
  /** entity_id */
  ei: string;
  /** platform */
  pl?: string;
  /** translation_key */
  tk?: string;
}

/**
 * finds the update entities and backup sensors. entity ids are localized (and differ per install),
 * so this looks them up by domain / translation key instead of hardcoding them - like the pwa
 */
export function useSystemDiscovery() {
  const { connection } = useHAConnection();
  const [entities, setEntities] = useState<SystemEntities | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;

    Promise.all([
      connection.sendMessagePromise<EntityState[]>({ type: 'get_states' }),
      connection.sendMessagePromise<{ entities: DisplayEntity[] }>({ type: 'config/entity_registry/list_for_display' }),
    ])
      .then(([states, registry]) => {
        if (cancelled) return;
        const backupSensor = (translationKey: string) =>
          registry.entities.find((e) => e.pl === 'backup' && e.tk === translationKey)?.ei;

        setEntities({
          updateIds: states.filter((s) => s.entity_id.startsWith('update.')).map((s) => s.entity_id),
          backup: {
            lastSuccessfulId: backupSensor('last_successful_automatic_backup'),
            nextScheduledId: backupSensor('next_scheduled_automatic_backup'),
            managerStateId: backupSensor('backup_manager_state'),
          },
        });
      })
      .catch((e: unknown) => {
        console.error(e);
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to look up entities.');
      });

    return () => {
      cancelled = true;
    };
  }, [connection]);

  return { entities, error };
}
