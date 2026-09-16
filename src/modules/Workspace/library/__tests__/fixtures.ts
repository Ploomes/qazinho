import type { ITestCase } from '@/modules/Plan/types';
import type { IWorkspace } from '@/modules/Workspace/types';

export const CASES: ITestCase[] = [
  {
    id: 'TC-01',
    title: 'Open the store and find a product',
    priority: 'P1',
    goal: 'The site loads.',
    preconditions: 'The URL answers.',
    steps: [
      { action: 'Open the target URL', expected: 'The home page loads' },
      { action: 'Search for a product', expected: 'At least one result comes back' },
      { action: 'Open the first result', expected: 'The page shows a price' },
    ],
    lastVerdict: null,
  },
  {
    id: 'TC-02',
    title: 'Checkout with a test card',
    priority: 'P1',
    goal: 'A card order goes through.',
    preconditions: 'One product in the cart.',
    steps: [
      { action: 'Add the product to the cart', expected: 'The cart badge reads 1' },
      { action: 'Leave the house number empty', expected: 'An inline error asks for it' },
      {
        action: 'Pay with the test card',
        expected: 'A confirmation with an order number',
      },
    ],
    lastVerdict: null,
  },
];

export function makeWorkspace(plan: ITestCase[] = CASES): IWorkspace {
  return {
    id: 'w1',
    projectId: 'p1',
    name: 'Checkout regression',
    targetId: 't1',
    planKind: 'web',
    sessionId: null,
    status: 'idle',
    issue: null,
    chat: [],
    plan,
    runs: [],
    bugs: [],
    live: null,
    hasBeenAsked: false,
  };
}
