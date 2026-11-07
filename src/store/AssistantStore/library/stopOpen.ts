import type { AssistantMessage } from '@/modules/Assistant/types';

/**
 * O chat depois que o turno foi parado: uma ferramenta ainda andando não terminou, e uma
 * confirmação do turno que ninguém respondeu venceu; `isClosing` vence as de fora também.
 */
export function stopOpen(
  messages: AssistantMessage[],
  isClosing = false,
): AssistantMessage[] {
  return messages.map((message) =>
    message.kind === 'tool' && message.state === 'doing'
      ? { ...message, state: 'failed' }
      : message.kind === 'confirm' &&
          message.decision === null &&
          (isClosing || message.from !== 'outside')
        ? { ...message, decision: 'expired' }
        : message,
  );
}
