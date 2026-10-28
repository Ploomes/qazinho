/**
 * A página com que o GitHub respondeu, como a de um comentário novo, a partir do que o gh
 * imprimiu; null quando não nomeou nenhuma.
 */
export function htmlUrlOf(text: string): string | null {
  try {
    const { html_url: url } = JSON.parse(text) as { html_url?: unknown };

    return typeof url === 'string' ? url : null;
  } catch {
    return null;
  }
}
