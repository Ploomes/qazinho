import type { IAgentTurn } from '@/types';

export const NO_BRIDGE: IAgentTurn = {
  sessionId: null,
  text: 'QAzinho is not talking to the machine. Restart the app.',
  usage: null,
  isError: true,
};
