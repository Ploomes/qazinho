const KILOBYTE = 1_024;
const MEGABYTE = KILOBYTE * KILOBYTE;

/** How much a request brought back: bytes under a kilobyte, kilobytes with a decimal under ten, megabytes with one above a megabyte. */
export function formatRequestSize(props: { bytes: number; language: string }): string {
  const { bytes, language } = props;
  const number = (value: number, digits: number) =>
    new Intl.NumberFormat(language, { maximumFractionDigits: digits }).format(value);

  if (bytes < KILOBYTE) return `${String(Math.max(0, Math.round(bytes)))} B`;

  if (bytes < MEGABYTE)
    return `${number(bytes / KILOBYTE, bytes < 10 * KILOBYTE ? 1 : 0)} kB`;

  return `${number(bytes / MEGABYTE, 1)} MB`;
}
