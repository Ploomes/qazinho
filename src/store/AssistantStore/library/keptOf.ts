import type { IAssistantStore } from '@/store/AssistantStore/types';
import { ASSISTANT_KEPT } from '@/modules/Assistant/constants';
import { stopOpen } from './stopOpen';

/**
 * O que do chat do Estagiário sobrevive ao QAzinho fechar: as últimas mensagens, sem nada
 * em andamento, e a sessão em que continuar.
 */
export function keptOf(
  state: Pick<IAssistantStore, 'messages' | 'sessionId' | 'sessionAgentId'>,
): Pick<IAssistantStore, 'messages' | 'sessionId' | 'sessionAgentId'> {
  return {
    messages: stopOpen(state.messages, true).slice(-ASSISTANT_KEPT),
    sessionId: state.sessionId,
    sessionAgentId: state.sessionAgentId,
  };
}
