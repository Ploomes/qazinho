import type { IChatTurn } from '@/shared/types';

export const NO_BRIDGE: IChatTurn = {
  sessionId: null,
  text: 'QAzinho is not talking to the machine. Restart the app.',
  usage: null,
  isError: true,
  answer: null,
};
