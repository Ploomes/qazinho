/**
 * Each line gh printed through a jq filter, read as JSON; lines that are not JSON are
 * left out.
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
