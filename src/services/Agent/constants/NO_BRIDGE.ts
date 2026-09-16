import type { IAgentTurn } from '@/types';

/** The page cannot reach the machine at all, which is a gocrash fault and not a test result. */
export const NO_BRIDGE: IAgentTurn = {
  sessionId: null,
  text: 'gocrash is not talking to the machine. Restart the app.',
  usage: null,
  isError: true,
};
