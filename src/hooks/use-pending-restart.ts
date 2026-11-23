import { useEffect, useState } from 'react';
import { useHAConnection } from 'hass-react';

/* an item of "repairs/list_issues" */
interface RepairIssue {
  domain: string;
  ignored: boolean;
  translation_key: string | null;
  translation_placeholders: Record<string, string> | null;
}

/**
 * what's waiting for a Home Assistant restart. HA has no flag for this - integrations
 * (e.g. HACS after an update) raise a "restart_required" repair issue instead.
 * refreshes whenever the issue registry changes
 */
export function usePendingRestart() {
  const { connection } = useHAConnection();
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;

    const refresh = () => {
      connection
        .sendMessagePromise<{ issues: RepairIssue[] }>({ type: 'repairs/list_issues' })
        .then(({ issues }) => {
          if (cancelled) return;
          setNames(
            issues
              .filter((i) => i.translation_key === 'restart_required' && !i.ignored)
              .map((i) => i.translation_placeholders?.name ?? i.domain),
          );
        })
        .catch(console.error);
    };

    refresh();
    const unsubscribe = connection.subscribeEvents(refresh, 'repairs_issue_registry_updated');
    return () => {
      cancelled = true;
      unsubscribe.then((unsub) => unsub()).catch(console.error);
    };
  }, [connection]);

  return names;
}
