import type { IAssistantStore } from '@/store/AssistantStore/types';
import { ASSISTANT_KEPT } from '@/modules/Assistant/constants';
import { stopOpen } from './stopOpen';

/** What of the Estagiário's chat outlives QAzinho closing: its latest messages, with nothing left going, and the session to go on in. */
export function keptOf(
  state: Pick<IAssistantStore, 'messages' | 'sessionId' | 'sessionAgentId'>,
): Pick<IAssistantStore, 'messages' | 'sessionId' | 'sessionAgentId'> {
  return {
    messages: stopOpen(state.messages).slice(-ASSISTANT_KEPT),
    sessionId: state.sessionId,
    sessionAgentId: state.sessionAgentId,
  };
}
