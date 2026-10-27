/**
 * The page GitHub answered with, such as a new comment's, out of what gh printed; null
 * when it named none.
 */
export function htmlUrlOf(text: string): string | null {
  try {
    const { html_url: url } = JSON.parse(text) as { html_url?: unknown };

    return typeof url === 'string' ? url : null;
  } catch {
    return null;
  }
}
