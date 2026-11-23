import { useEffect, useState } from 'react';
import { useHAConnection } from 'hass-react';

/* until HA's config arrives */
export const DEFAULT_TEMPERATURE_UNIT = '°C';

// fetched once, shared by every caller
let unitPromise: Promise<string> | null = null;

/** the unit HA shows temperatures in - climate entities have no unit_of_measurement of their own */
export function useTemperatureUnit() {
  const { connection } = useHAConnection();
  const [unit, setUnit] = useState(DEFAULT_TEMPERATURE_UNIT);

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;
    unitPromise ??= connection
      .sendMessagePromise<{ unit_system: { temperature: string } }>({ type: 'get_config' })
      .then((config) => config.unit_system.temperature);
    unitPromise
      .then((u) => {
        if (!cancelled) setUnit(u);
      })
      .catch(() => {
        // try again on the next connection
        unitPromise = null;
      });
    return () => {
      cancelled = true;
    };
  }, [connection]);

  return unit;
}
