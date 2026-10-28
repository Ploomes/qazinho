import type { AssistantMessage } from '@/modules/Assistant/types';

/**
 * O chat com o que o assistente disse até agora guardado como uma mensagem própria, para
 * uma ferramenta que ele usa em seguida aparecer embaixo; uma vez basta.
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
