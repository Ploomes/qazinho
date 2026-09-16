/** What the agent tells the QA about a step it had to work around; empty when it had nothing to say. */
export function parseNote(answer: string): string {
  try {
    const read = JSON.parse(answer) as { note?: unknown };

    return typeof read.note === 'string' ? read.note.trim() : '';
  } catch {
    return '';
  }
}
