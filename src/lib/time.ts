/*
 * hand-rolled because Hermes doesn't ship Intl.RelativeTimeFormat on every platform.
 * short on purpose, to fit half-width buttons and narrow rows
 */

/** "12m", "3h", "2d 5h" - "0m" under a minute */
export function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days) return hours % 24 ? `${days}d ${hours % 24}h` : `${days}d`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

/** "just now", "12m ago", "3h ago", "2d 5h ago" */
export function relativePast(timestamp: Date | string, now = Date.now()) {
  const ms = now - new Date(timestamp).getTime();
  return ms < 60_000 ? 'just now' : `${formatDuration(ms)} ago`;
}

/** "in 12m", "in 3h", "in 2d 5h" - "now" when it's (about) due */
export function relativeFuture(timestamp: Date | string, now = Date.now()) {
  const ms = new Date(timestamp).getTime() - now;
  return ms < 60_000 ? 'now' : `in ${formatDuration(ms)}`;
}
