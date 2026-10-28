/**
 * O CQL que uma busca de página pergunta: as páginas cujo título contém o que o QA
 * digitou, ou, sem nada digitado, as que ele trabalhou por último.
 */
export function cqlOf(query: string): string {
  const typed = query
    .trim()
    .replace(/["\\\\]/g, ' ')
    .trim();

  return typed === ''
    ? 'type = page AND contributor = currentUser() ORDER BY lastmodified DESC'
    : `type = page AND title ~ "${typed}*" ORDER BY lastmodified DESC`;
}
