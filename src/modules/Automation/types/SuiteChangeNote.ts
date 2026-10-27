/**
 * Something the agent did while it changed a suite, as the page keeps it: a line it said
 * or did, or how the tests it ran went.
 */
export type SuiteChangeNote =
  | { id: number; kind: 'said'; text: string }
  | { id: number; kind: 'ran'; total: number; passed: number };
