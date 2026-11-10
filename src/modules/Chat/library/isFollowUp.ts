import type { ChatMessage } from '@/modules/Chat/types';

/** Se uma fala do agente segue outra dele mesmo, que já mostrou o rosto e o nome. */
export function isFollowUp(props: {
  message: ChatMessage;
  previous: ChatMessage | null;
}): boolean {
  const { message, previous } = props;

  return (
    previous !== null &&
    isAgentWords(message) &&
    isAgentWords(previous) &&
    message.who === previous.who
  );
}

function isAgentWords(
  message: ChatMessage,
): message is Extract<ChatMessage, { kind: 'agent' | 'note' }> {
  return message.kind === 'agent' || message.kind === 'note';
}
