import type { ChatMessage } from './ChatMessage';
import type { IRunMessage } from './IRunMessage';

/** One line of the chat as drawn: a message on its own, or a run with everything it said kept together. */
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
