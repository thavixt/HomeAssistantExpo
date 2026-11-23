import { useEffect, useState } from 'react';

/** the current timestamp, refreshed every `intervalMs` - for relative times like "5m ago" */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
