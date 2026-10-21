import type { ChatFailure } from './ChatFailure';
import type { IAgentTurn } from './IAgentTurn';
import type { IChatAnswer } from './IChatAnswer';
import type { ICodeSource } from './ICodeSource';

/** A chat turn: what the CLI reported, the answer read out of it, why it failed when it did, and the code it read. */
export interface IChatTurn extends IAgentTurn {
  answer: IChatAnswer | null;
  failure: ChatFailure | null;
  code: ICodeSource | null;
}
