const UNITS = ['kilobyte', 'megabyte', 'gigabyte'] as const;

/** A unidade de disco que lê bem um número de bytes, e quanto ele vale nela. */
export function sizeScaleOf(bytes: number): {
  unit: (typeof UNITS)[number];
  amount: number;
  fractionDigits: number;
} {
  const steps = Math.min(
    UNITS.length - 1,
    Math.max(0, Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)) - 1),
  );
  const unit = UNITS[steps] ?? 'kilobyte';

  return {
    unit,
    amount: bytes / 1024 ** (steps + 1),
    fractionDigits: unit === 'kilobyte' ? 0 : 1,
  };
}
