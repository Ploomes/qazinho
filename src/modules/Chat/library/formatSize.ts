/**
 * Um número de bytes como o QA lê um download: kilobytes abaixo de um megabyte, megabytes
 * com uma casa decimal acima.
 */
export function formatSize(props: { bytes: number; language: string }): string {
  const isSmall = props.bytes < 1024 * 1024;

  return new Intl.NumberFormat(props.language, {
    style: 'unit',
    unit: isSmall ? 'kilobyte' : 'megabyte',
    maximumFractionDigits: isSmall ? 0 : 1,
  }).format(isSmall ? props.bytes / 1024 : props.bytes / (1024 * 1024));
}
