/**
 * O site do Jira como uma origem, a partir do que o QA colou: um host puro, uma URL, ou
 * uma página dentro dele.
 */
export function jiraSiteOf(typed: string): string | null {
  const trimmed = typed.trim();

  if (trimmed.length === 0) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);

    if (url.protocol !== 'https:' || !url.hostname.includes('.')) return null;

    return url.origin;
  } catch {
    return null;
  }
}
