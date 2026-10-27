/**
 * The owner and name a QA's words give for a GitHub repository, as owner/name or its
 * github.com address; null for anything else.
 */
export function repositoryOfName(text: string): { owner: string; name: string } | null {
  const path = text
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');
  const match = /^([\w.-]+)\/([\w.-]+)$/.exec(path);

  if (!match?.[1] || !match[2]) return null;

  return { owner: match[1], name: match[2] };
}
