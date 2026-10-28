import type { RunFailure } from './RunFailure';

/** Por que uma mudança não deixou nada para revisar. */
export type SuiteChangeFailure =
  | { reason: 'no-suite' }
  | { reason: 'no-git'; said: string }
  | { reason: 'copy'; said: string }
  | { reason: 'no-runner' }
  | { reason: 'agent-missing'; agentId: string }
  | { reason: 'agent'; failure: RunFailure }
  | { reason: 'no-change' }
  | { reason: 'closed' }
  | { reason: 'other'; said: string };
