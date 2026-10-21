import type { ChatFailure } from './ChatFailure';
import type { IAgentTurn } from './IAgentTurn';

/** An assistant turn: what the agent said, and why it failed when it did. */
export interface IAssistantTurn extends IAgentTurn {
  failure: ChatFailure | null;
}
