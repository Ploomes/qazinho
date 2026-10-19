import type { RunFailure } from './RunFailure';

/** Why a chat turn stopped short: what stops a run too, or the QA stopping the answer themselves. */
export type ChatFailure = RunFailure | { reason: 'stopped' };
