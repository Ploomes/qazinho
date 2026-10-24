import type { IProSyncCase } from '@/shared/types';

/** A case of the checkout plan, with its title and its one step's expected result made to order. */
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
