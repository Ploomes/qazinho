const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/** A size in bytes as a person reads it, in the largest unit under a thousand of it. */
export function bytesLabelOf(props: { bytes: number; language: string }): string {
  const { bytes, language } = props;
  let value = Math.max(0, bytes);
  let unit = 0;

  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }

  const number = new Intl.NumberFormat(language, {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);

  return `${number} ${UNITS[unit] ?? 'GB'}`;
}
