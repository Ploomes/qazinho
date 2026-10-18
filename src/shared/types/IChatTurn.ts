import type { IAgentTurn } from './IAgentTurn';
import type { IChatAnswer } from './IChatAnswer';

/** A chat turn: what the CLI reported, and the answer read out of it, null when it could not be read. */
export interface IChatTurn extends IAgentTurn {
  answer: IChatAnswer | null;
}
