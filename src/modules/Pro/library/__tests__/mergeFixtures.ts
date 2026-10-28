import type { IProSyncCase } from '@/shared/types';

/**
 * Um caso do plano de checkout, com o título e o resultado esperado do único passo feitos
 * sob medida.
 */
export function caseOf(props: {
  id: string;
  title?: string;
  expected?: string;
}): IProSyncCase {
  return {
    id: props.id,
    title: props.title ?? `Case ${props.id}`,
    priority: 'P1',
    goal: '',
    preconditions: '',
    steps: [{ action: 'Open the cart', expected: props.expected ?? 'The cart opens' }],
  };
}
