/** When a project last reached its org, as the QA's language writes a day and a time. */
export function formatSyncedAt(props: { at: string; language: string }): string {
  return new Intl.DateTimeFormat(props.language, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(props.at));
}
