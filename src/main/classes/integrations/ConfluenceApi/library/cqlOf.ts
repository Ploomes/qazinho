/**
 * The CQL a page search asks: the pages whose title holds what the QA typed, or with
 * nothing typed the pages they worked on last.
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
