/**
 * Share of the whole machine a process used between two sweeps; ps's own %cpu is a
 * decaying per-core average.
 */
export function cpuPercent(props: {
  before: number | undefined;
  after: number;
  elapsedMs: number;
  cores: number;
}): number {
  const { before, after, elapsedMs, cores } = props;

  if (before === undefined || elapsedMs <= 0 || cores <= 0) return 0;

  const used = Math.max(0, after - before);

  return (used / (elapsedMs / 1_000) / cores) * 100;
}
