import type { ChatMessage } from './ChatMessage';
import type { IRunMessage } from './IRunMessage';
import type { OutsideCaller } from '@/shared/types';

/**
 * Uma linha do chat como desenhada: uma mensagem, uma run com tudo o que disse, ou uma
 * conversa do agente de código do QA com o agente do chat.
 */
export type ChatItem =
  | { kind: 'message'; message: ChatMessage; isNew: boolean }
  | {
      kind: 'run';
      runId: string;
      at: string;
      messages: { message: ChatMessage; isNew: boolean }[];
      card: IRunMessage | null;
      isNew: boolean;
    }
  | {
      kind: 'talk';
      id: string;
      caller: OutsideCaller;
      at: string;
      messages: { message: ChatMessage; isNew: boolean }[];
      readAt: string | null;
      isNew: boolean;
    };
