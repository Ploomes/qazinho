import type { ChatItem } from '@/modules/Chat/types';

type TalkItem = Extract<ChatItem, { kind: 'talk' }>;

/**
 * Junta numa conversa o que o agente de código do QA escreveu e o que o agente do chat
 * respondeu, até o QA escrever de novo ou uma run começar.
 */
export function groupOutsideTalks(items: readonly ChatItem[]): ChatItem[] {
  const grouped: ChatItem[] = [];
  let talk: TalkItem | null = null;

  for (const item of items) {
    if (item.kind !== 'message') {
      talk = null;
      grouped.push(item);
      continue;
    }

    const { message } = item;
    const isOutside = message.kind === 'user' && message.from === 'agent';
    const isQa = message.kind === 'user' && message.from !== 'agent';

    if (isQa) talk = null;

    if (isOutside) {
      if (talk === null) {
        talk = {
          kind: 'talk',
          id: message.id,
          caller: message.caller ?? 'other',
          at: message.at,
          messages: [],
          readAt: null,
          isNew: item.isNew,
        };
        grouped.push(talk);
      }

      talk.readAt = message.readAt ?? null;
    }

    if (talk === null) grouped.push(item);
    else talk.messages.push({ message, isNew: item.isNew });
  }

  return grouped;
}
