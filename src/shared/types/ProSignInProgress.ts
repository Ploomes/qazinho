import type { ProSignInPhase } from './ProSignInPhase';
import type { ProSignInStep } from './ProSignInStep';

/** Signing this machine in to QAzinho Pro, as main reports it each time it moves: its steps, and where it stands. */
export type ProSignInProgress = { steps: ProSignInStep[] } & ProSignInPhase;
