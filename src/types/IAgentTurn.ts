import type { IAgentUsage } from './IAgentUsage';

/** One turn of the conversation, as the agent's own CLI reported it. */
export interface IAgentTurn {
  sessionId: string | null;
  text: string;
  usage: IAgentUsage | null;
  isError: boolean;
}
