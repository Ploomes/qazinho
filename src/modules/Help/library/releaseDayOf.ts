/** O dia de uma versão, curto e no idioma do QA ("15 de nov."), lido como data local. */
export function releaseDayOf(args: { date: string; language: string }): string {
  const [year = 0, month = 1, day = 1] = args.date.split('-').map(Number);

  return new Intl.DateTimeFormat(args.language, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, day));
}
