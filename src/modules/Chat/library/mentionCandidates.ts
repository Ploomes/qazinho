import type { IChatReference } from '@/shared/types';

/**
 * What the @ picker offers for the word being typed: every id or title that holds it, for
 * the tabs to sort.
 */
export function mentionCandidates(props: {
  references: IChatReference[];
  query: string | null;
}): IChatReference[] {
  if (props.query === null) return [];

  const query = props.query.toLowerCase();

  return props.references.filter(
    (reference) =>
      reference.id.toLowerCase().includes(query) ||
      reference.title.toLowerCase().includes(query),
  );
}
