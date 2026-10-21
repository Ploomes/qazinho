const MINUTE_MS = 60_000;
const EARLY_SHARE = 1 / 3;

/** What to tell an explorer that wants to finish while more than a third of its time is left, or null when it may finish. */
export function earlyFinish(props: { leftMs: number; totalMs: number }): string | null {
  const { leftMs, totalMs } = props;

  if (leftMs <= totalMs * EARLY_SHARE) return null;

  const minutes = Math.max(1, Math.round(leftMs / MINUTE_MS));

  return `About ${String(minutes)} minute${minutes === 1 ? ' is' : 's are'} still left: use ${minutes === 1 ? 'it' : 'them'}. Try what you have not yet, such as the flows you did not take to the end, the edges of each field, and every control and screen you have not used, then call finish again.`;
}
