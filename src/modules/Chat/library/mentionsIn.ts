import type { IChatReference } from '@/shared/types';

/**
 * As referências para as quais uma mensagem ainda aponta: uma menção apagada do texto é
 * descartada.
 */
export function mentionsIn(props: {
  text: string;
  references: IChatReference[];
}): IChatReference[] {
  const tokens = new Set(props.text.match(/@[\w-]+/g) ?? []);
  const kept = new Map<string, IChatReference>();

  for (const reference of props.references)
    if (tokens.has(`@${reference.id}`) && !kept.has(reference.id))
      kept.set(reference.id, reference);

  return [...kept.values()];
}
