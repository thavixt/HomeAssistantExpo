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

/** today at a "HH:MM" or "HH:MM:SS" time, in local time */
export function timeToday(time: string, now = Date.now()) {
  const [hours, minutes, seconds = 0] = time.split(':').map(Number);
  const date = new Date(now);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

/** "06:30" - always 24-hour, whatever the device's locale */
export function formatTime(date: Date) {
  return [date.getHours(), date.getMinutes()].map((n) => String(n).padStart(2, '0')).join(':');
}

/** the next weekday occurrence of a "HH:MM:SS" time - today if it's still ahead, otherwise the next weekday */
export function nextWeekdayOccurrence(time: string, now = Date.now()) {
  const next = timeToday(time, now);
  if (next.getTime() <= now) next.setDate(next.getDate() + 1);
  // setDate keeps the wall-clock time across dst changes
  while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  return next;
}
