const KILOBYTE = 1_024;
const MEGABYTE = KILOBYTE * KILOBYTE;

/**
 * Quanto um pedido trouxe: bytes abaixo de um kilobyte, kilobytes com uma decimal abaixo
 * de dez, megabytes com uma acima de um megabyte.
 */
export function formatRequestSize(props: { bytes: number; language: string }): string {
  const { bytes, language } = props;
  const number = (value: number, digits: number) =>
    new Intl.NumberFormat(language, { maximumFractionDigits: digits }).format(value);

  if (bytes < KILOBYTE) return `${String(Math.max(0, Math.round(bytes)))} B`;

  if (bytes < MEGABYTE)
    return `${number(bytes / KILOBYTE, bytes < 10 * KILOBYTE ? 1 : 0)} kB`;

  return `${number(bytes / MEGABYTE, 1)} MB`;
}
