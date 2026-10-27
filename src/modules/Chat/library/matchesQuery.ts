/**
 * Whether a text holds every word of a query, with no care for accents or case; an empty
 * query matches anything.
 */
export function matchesQuery(props: { text: string; query: string }): boolean {
  const text = plain(props.text);

  return plain(props.query)
    .split(/\s+/)
    .filter((term) => term !== '')
    .every((term) => text.includes(term));
}

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
