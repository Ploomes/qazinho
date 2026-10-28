/**
 * A palavra sendo digitada depois de um @ no fim do rascunho, ou null quando o QA não
 * está mencionando.
 */
export function mentionQueryOf(draft: string): string | null {
  const match = /(?:^|\s)@([\w-]*)$/.exec(draft);

  return match ? (match[1] ?? '') : null;
}
