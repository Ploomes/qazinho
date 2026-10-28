import type { AssistantMessage } from '@/modules/Assistant/types';

/**
 * O chat depois que o turno foi parado: uma ferramenta ainda andando não terminou, e uma
 * confirmação que ninguém respondeu venceu.
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
