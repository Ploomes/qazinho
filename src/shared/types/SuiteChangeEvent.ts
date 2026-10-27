import type { ISuiteChange } from './ISuiteChange';

/**
 * What reaches the page while the agent changes a suite: the change as it now stands, a
 * line of what the agent says and does, or how the tests it ran went.
 */
export type SuiteChangeEvent =
  | { kind: 'changed'; change: ISuiteChange }
  | { kind: 'line'; projectId: string; changeId: string; text: string }
  | { kind: 'ran'; projectId: string; changeId: string; total: number; passed: number };
