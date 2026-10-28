/**
 * Se um texto contém toda palavra de uma busca, sem ligar para acentos ou caixa; uma
 * busca vazia casa com qualquer coisa.
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
