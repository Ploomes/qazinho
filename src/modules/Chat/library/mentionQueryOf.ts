/** The word being typed after an @ at the end of the draft, or null when the QA is not mentioning. */
export function mentionQueryOf(draft: string): string | null {
  const match = /(?:^|\s)@([\w-]*)$/.exec(draft);

  return match ? (match[1] ?? '') : null;
}
