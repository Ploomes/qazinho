/**
 * The number and page of the issue GitHub answered with, once it made one; null for any
 * other answer.
 */
export function githubIssueOf(text: string): { number: number; url: string } | null {
  try {
    const { number, html_url: url } = JSON.parse(text) as {
      number?: unknown;
      html_url?: unknown;
    };

    return typeof number === 'number' && typeof url === 'string' ? { number, url } : null;
  } catch {
    return null;
  }
}
