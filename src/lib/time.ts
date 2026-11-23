/**
 * a short "how long ago", e.g. "just now", "12m ago", "3h ago", "2d 5h ago" - short enough for a half-width button.
 * hand-rolled because Hermes doesn't ship Intl.RelativeTimeFormat on every platform
 */
export function relativePast(timestamp: Date | string, now = Date.now()) {
  const minutes = Math.floor((now - new Date(timestamp).getTime()) / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days) return hours % 24 ? `${days}d ${hours % 24}h ago` : `${days}d ago`;
  if (hours) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
