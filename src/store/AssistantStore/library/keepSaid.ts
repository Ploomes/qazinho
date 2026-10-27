import type { AssistantMessage } from '@/modules/Assistant/types';

/**
 * The chat with what the assistant said so far kept as a message of its own, so a tool it
 * uses next shows below it; once is enough.
 */
export function keepSaid(props: {
  messages: AssistantMessage[];
  said: string;
  id: string;
}): AssistantMessage[] {
  const said = props.said.trim();
  const last = props.messages.at(-1);

  if (said === '' || (last?.kind === 'agent' && last.text.trim() === said))
    return props.messages;

  return [...props.messages, { kind: 'agent', id: props.id, text: said }];
}
