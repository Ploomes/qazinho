/** Um dia como o idioma do QA o escreve, a partir de um timestamp ISO guardado. */
export function formatDay(props: { iso: string; language: string }): string {
  const day = new Date(props.iso);

  if (Number.isNaN(day.getTime())) return props.iso;

  return new Intl.DateTimeFormat(props.language, { dateStyle: 'medium' }).format(day);
}
