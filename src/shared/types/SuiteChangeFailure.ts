import type { RunFailure } from './RunFailure';

/** Why a change left nothing to review: no suite, a folder git does not keep, no copy, no Playwright to run it, no agent, the agent failing, nothing changed, QAzinho closing while it worked, or something QAzinho did not expect. */
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
