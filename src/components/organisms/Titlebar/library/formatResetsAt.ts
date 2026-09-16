/** The agent reports the reset as a unix second; a clock time never goes stale on screen. */
export function formatResetsAt(resetsAt: number): string {
  if (resetsAt <= 0) return '';

  return new Date(resetsAt * 1_000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
