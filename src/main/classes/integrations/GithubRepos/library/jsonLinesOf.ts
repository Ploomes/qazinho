/**
 * Cada linha que o gh imprimiu por um filtro jq, lida como JSON; linhas que não são JSON
 * ficam de fora.
 */
export function jsonLinesOf(text: string): unknown[] {
  return text.split('\n').flatMap((line) => {
    if (line.trim() === '') return [];

    try {
      return [JSON.parse(line) as unknown];
    } catch {
      return [];
    }
  });
}
