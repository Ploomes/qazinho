const UNITS = ['kilobyte', 'megabyte', 'gigabyte'] as const;

/**
 * Um número de bytes como uma pessoa lê num disco: kilobytes, megabytes ou gigabytes, com
 * uma decimal depois de um megabyte.
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
