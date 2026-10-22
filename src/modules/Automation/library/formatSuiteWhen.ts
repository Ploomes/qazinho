/** When a suite's run happened, as the QA's language writes a day and a time. */
export function formatSuiteWhen(props: { at: number; language: string }): string {
  return new Intl.DateTimeFormat(props.language, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(props.at));
}
