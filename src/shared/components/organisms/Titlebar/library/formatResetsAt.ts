/** The agent reports the reset as a unix second; a clock time in the QA's language never goes stale on screen. */
export function formatResetsAt(props: { resetsAt: number; language: string }): string {
  if (props.resetsAt <= 0) return '';

  return new Date(props.resetsAt * 1_000).toLocaleTimeString(props.language, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
