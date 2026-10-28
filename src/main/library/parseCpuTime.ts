/**
 * Lê o tempo de cpu acumulado que `ps -o time=` imprime,
 * `[days-][hours:]minutes:seconds`, como segundos.
 */
export function parseCpuTime(text: string): number {
  const [days, clock] = text.includes('-') ? text.split('-') : ['0', text];
  const parts = (clock ?? '').split(':').map(Number);

  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part))) return 0;

  const seconds = parts.reduce((total, part) => total * 60 + part, 0);

  return Number(days) * 86_400 + seconds;
}
