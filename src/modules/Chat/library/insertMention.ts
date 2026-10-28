/** Completa o @ sendo digitado no fim do rascunho com o id que o QA escolheu. */
export function insertMention(props: { draft: string; id: string }): string {
  return props.draft.replace(/@[\w-]*$/, `@${props.id} `);
}
