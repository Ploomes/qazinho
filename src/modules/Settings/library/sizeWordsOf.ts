const UNITS = ['kilobyte', 'megabyte', 'gigabyte'] as const;

/**
 * A number of bytes as a person reads it on a disk: kilobytes, megabytes or gigabytes,
 * with one decimal past a megabyte.
 */
export function sizeWordsOf(props: { bytes: number; language: string }): string {
  const steps = Math.min(
    UNITS.length - 1,
    Math.max(0, Math.floor(Math.log(Math.max(props.bytes, 1)) / Math.log(1024)) - 1),
  );
  const unit = UNITS[steps] ?? 'kilobyte';

  return new Intl.NumberFormat(props.language, {
    style: 'unit',
    unit,
    maximumFractionDigits: unit === 'kilobyte' ? 0 : 1,
  }).format(props.bytes / 1024 ** (steps + 1));
}
