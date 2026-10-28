import type { IChatReference } from '@/shared/types';

/**
 * O que o seletor de @ oferece para a palavra sendo digitada: todo id ou título que a
 * contém, para as abas ordenarem.
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
