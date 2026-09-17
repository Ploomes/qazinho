/** Completes the @ being typed at the end of the draft with the id the QA picked. */
export function insertMention(props: { draft: string; id: string }): string {
  return props.draft.replace(/@[\w-]*$/, `@${props.id} `);
}
