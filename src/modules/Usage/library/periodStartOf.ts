/** A meia-noite local do primeiro dos últimos dias, contando o de hoje. */
export function periodStartOf(args: { days: number; now: number }): number {
  const start = new Date(args.now);

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (args.days - 1));

  return start.getTime();
}
