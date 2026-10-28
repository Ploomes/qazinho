/**
 * O número e a página da issue com que o GitHub respondeu, quando criou uma; null para
 * qualquer outra resposta.
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
