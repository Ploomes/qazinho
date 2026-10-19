import type { ChatFailure } from './ChatFailure';
import type { IAgentTurn } from './IAgentTurn';
import type { IChatAnswer } from './IChatAnswer';

/** A chat turn: what the CLI reported, the answer read out of it, and why it failed when it did. */
export interface IChatTurn extends IAgentTurn {
  answer: IChatAnswer | null;
  failure: ChatFailure | null;
}
