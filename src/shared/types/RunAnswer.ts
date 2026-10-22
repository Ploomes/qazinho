/** How a run's question ended, as the page may know it: the QA's words, a secret by its name and whether the project keeps it, no answer in time, or the run stopped first. */
export type RunAnswer =
  | { kind: 'said'; text: string }
  | { kind: 'secret'; name: string; isKept: boolean }
  | { kind: 'unanswered' }
  | { kind: 'stopped' };
