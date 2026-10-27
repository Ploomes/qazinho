import type { RunFailure } from './RunFailure';

/** Why a change left nothing to review. */
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
