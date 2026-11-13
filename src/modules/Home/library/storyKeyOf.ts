const KEY = /^[A-Z][A-Z0-9_]*-\d+$/i;
const IN_LINK = /(?:\/browse\/|[?&]selectedIssue=)([A-Z][A-Z0-9_]*-\d+)\b/i;

/** A chave da história do Jira que o QA escreveu, sozinha ou num link dela, ou null. */
export function storyKeyOf(typed: string): string | null {
  const text = typed.trim();

  if (KEY.test(text)) return text.toUpperCase();

  return IN_LINK.exec(text)?.[1]?.toUpperCase() ?? null;
}
