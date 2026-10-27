import type { AssistantMessage } from '@/modules/Assistant/types';

/**
 * The chat once its turn was stopped: a tool still going did not finish, and a
 * confirmation nobody answered ran out.
 */
export function stopOpen(messages: AssistantMessage[]): AssistantMessage[] {
  return messages.map((message) =>
    message.kind === 'tool' && message.state === 'doing'
      ? { ...message, state: 'failed' }
      : message.kind === 'confirm' && message.decision === null
        ? { ...message, decision: 'expired' }
        : message,
  );
}
