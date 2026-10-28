/**
 * A fatia da máquina inteira que um processo usou entre duas varreduras; o %cpu do
 * próprio ps é uma média por núcleo que decai.
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
