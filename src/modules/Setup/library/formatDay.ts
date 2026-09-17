/** A day as the QA's language writes it, from a stored ISO timestamp. */
export function formatDay(props: { iso: string; language: string }): string {
  const day = new Date(props.iso);

  if (Number.isNaN(day.getTime())) return props.iso;

  return new Intl.DateTimeFormat(props.language, { dateStyle: 'medium' }).format(day);
}
