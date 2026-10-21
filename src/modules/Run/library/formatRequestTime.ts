/** How long a request took, in milliseconds under a second, then seconds with a decimal under ten. */
export function formatRequestTime(props: { ms: number; language: string }): string {
  const ms = Math.max(0, props.ms);

  if (ms < 1_000) return `${String(Math.round(ms))} ms`;

  const seconds = new Intl.NumberFormat(props.language, {
    maximumFractionDigits: ms < 10_000 ? 1 : 0,
  }).format(ms / 1_000);

  return `${seconds} s`;
}
