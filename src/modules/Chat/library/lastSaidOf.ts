import type { ChatMessage } from '@/modules/Chat/types';

const ASIDES: ChatMessage['kind'][] = ['memory', 'skills', 'named'];

/** A última mensagem da conversa, sem as notas que o QAzinho põe ao lado dela. */
export function lastSaidOf(chat: ChatMessage[]): ChatMessage | undefined {
  return chat.findLast(({ kind }) => !ASIDES.includes(kind));
}
