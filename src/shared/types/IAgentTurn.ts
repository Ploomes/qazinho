import type { IAgentUsage } from './IAgentUsage';

/** One turn of the conversation, as the agent's own CLI reported it; `costUsd` is null when the agent did not say. */
export interface IAgentTurn {
  sessionId: string | null;
  text: string;
  usage: IAgentUsage | null;
  isError: boolean;
  costUsd: number | null;
}
