import type { ChatMessage } from '@/modules/Chat/types';

/** Se o agente desta fala é o da última fala de agente antes dela. */
export function isFollowUp(props: {
  message: ChatMessage;
  earlier: readonly ChatMessage[];
}): boolean {
  const { message, earlier } = props;
  const lastWords = earlier.findLast(isAgentWords);

  return (
    isAgentWords(message) && lastWords !== undefined && message.who === lastWords.who
  );
}

function isAgentWords(
  message: ChatMessage,
): message is Extract<ChatMessage, { kind: 'agent' | 'note' }> {
  return message.kind === 'agent' || message.kind === 'note';
}
