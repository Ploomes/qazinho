import type { ChatMessage } from './ChatMessage';
import type { IRunMessage } from './IRunMessage';

/**
 * Uma linha do chat como desenhada: uma mensagem sozinha, ou uma run com tudo o que disse
 * mantido junto.
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
    };
