import type { ProSignInPhase } from './ProSignInPhase';
import type { ProSignInStep } from './ProSignInStep';

/**
 * Esta máquina entrando no QAzinho Pro, como a main relata a cada mudança: os passos, e
 * em que pé está.
 */
export type ProSignInProgress = { steps: ProSignInStep[] } & ProSignInPhase;
