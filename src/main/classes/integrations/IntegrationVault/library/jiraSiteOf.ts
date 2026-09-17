/** The Jira site as an origin, from whatever the QA pasted: a bare host, a URL, or a page inside it. */
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
