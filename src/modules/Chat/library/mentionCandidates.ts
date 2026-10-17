import type { IChatReference } from '@/shared/types';

const LIMIT = 8;

/** What the @ picker offers for the word being typed: an id or a title that holds it, at most eight. */
export function mentionCandidates(props: {
  references: IChatReference[];
  query: string | null;
}): IChatReference[] {
  if (props.query === null) return [];

  const query = props.query.toLowerCase();

  return props.references
    .filter(
      (reference) =>
        reference.id.toLowerCase().includes(query) ||
        reference.title.toLowerCase().includes(query),
    )
    .slice(0, LIMIT);
}
