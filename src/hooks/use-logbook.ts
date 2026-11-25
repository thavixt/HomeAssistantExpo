import { useHAConnection } from 'hass-react';
import { useEffect, useRef, useState } from 'react';

export interface LogbookEntry {
  /** unix timestamp in seconds */
  when: number;
  entity_id?: string;
  state?: string;
  name?: string;
  message?: string;
  domain?: string;
  /* what caused it, e.g. an automation */
  context_entity_id?: string;
  context_name?: string;
}

interface LogbookStreamMessage {
  events: LogbookEntry[];
}

const HOUR_MS = 60 * 60 * 1000;
/* how far back loading more goes - HA's recorder keeps 10 days by default */
const MAX_LOOKBACK_MS = 10 * 24 * HOUR_MS;

/** unique per logbook entry - also the list key, since one entity can log two events in the same second */
export const entryKey = (entry: LogbookEntry) => `${entry.when}|${entry.entity_id}|${entry.state ?? entry.message}`;

const toMessage = (error: unknown, fallback: string) =>
  (error as { message?: string } | undefined)?.message || fallback;

// merge + dedupe, since history may arrive in chunks and is resent after a reconnect
const merge = (current: LogbookEntry[], incoming: LogbookEntry[]) => {
  const byKey = new Map(current.map((e) => [entryKey(e), e]));
  incoming.forEach((e) => byKey.set(entryKey(e), e));
  return [...byKey.values()].sort((a, b) => b.when - a.when);
};

/**
 * streams logbook entries (the last `hours` first, then live) for the given entities, newest first.
 * shows `pageSize` of them - `loadMore` reveals the next page, fetching older history when needed
 */
export function useLogbook(entityIds: string[], { hours = 24, pageSize = 20 } = {}) {
  const { connection } = useHAConnection();
  // everything loaded so far, newest first - only the first `shown` are returned
  const [all, setAll] = useState<LogbookEntry[]>([]);
  const [shown, setShown] = useState(pageSize);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  // start of the oldest time range fetched so far (ms)
  const fetchedFrom = useRef<number | null>(null);
  // guards against a second loadMore before the loadingMore state lands
  const busy = useRef(false);
  const entityKey = entityIds.join(',');
  const subscriptionKey = `${entityKey}|${hours}`;
  // the subscription that has sent its first message - a reconnect keeps it, so the last entries stay on screen
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!connection) return;
    const start = Date.now() - hours * HOUR_MS;
    // a reconnect restarts the stream, but the older pages already loaded stay
    fetchedFrom.current ??= start;
    const unsubscribe = connection.subscribeMessage<LogbookStreamMessage>(
      ({ events }) => {
        // the first message ends loading even when it's empty (no entries in the time window)
        setLoadedKey(subscriptionKey);
        setError(null);
        if (events.length) setAll((current) => merge(current, events));
      },
      { type: 'logbook/event_stream', start_time: new Date(start).toISOString(), entity_ids: entityKey.split(',') },
    );
    unsubscribe.catch((e) => {
      console.warn('logbook subscription failed', e);
      setError(toMessage(e, 'Failed to load the logbook.'));
      // a failed subscription ends loading too, so the card shows the error instead of its placeholder
      setLoadedKey(subscriptionKey);
    });
    return () => {
      unsubscribe.then((unsub) => unsub()).catch(() => {});
    };
  }, [connection, entityKey, hours, subscriptionKey]);

  const loadMore = async () => {
    if (!connection || busy.current) return;
    const wanted = shown + pageSize;
    if (all.length >= wanted || exhausted) {
      setShown(wanted);
      return;
    }
    busy.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const oldest = Date.now() - MAX_LOOKBACK_MS;
      let count = all.length;
      let end = fetchedFrom.current ?? Date.now() - hours * HOUR_MS;
      // step back a window at a time until there's a page's worth, or nothing older is kept
      while (count < wanted && end > oldest) {
        const start = Math.max(end - hours * HOUR_MS, oldest);
        const events = await connection.sendMessagePromise<LogbookEntry[]>({
          type: 'logbook/get_events',
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          entity_ids: entityKey.split(','),
        });
        fetchedFrom.current = start;
        end = start;
        count += events.length;
        setAll((current) => merge(current, events));
      }
      if (end <= oldest) setExhausted(true);
      setShown(wanted);
    } catch (e) {
      console.warn('loading older logbook entries failed', e);
      setError(toMessage(e, 'Failed to load older activity.'));
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  };

  return {
    entries: all.slice(0, shown),
    error,
    loading: loadedKey !== subscriptionKey,
    loadingMore,
    hasMore: all.length > shown || !exhausted,
    loadMore,
  };
}
