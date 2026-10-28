/** Quando a run de uma suíte aconteceu, como o idioma do QA escreve um dia e uma hora. */
export function formatSuiteWhen(props: { at: number; language: string }): string {
  return new Intl.DateTimeFormat(props.language, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(props.at));
}
