/** A moment of a video down to the tenth of a second, as minutes and seconds. */
export function formatClock(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = String(Math.floor(tenths / 10) % 60).padStart(2, '0');

  return `${String(minutes)}:${seconds}.${String(tenths % 10)}`;
}
