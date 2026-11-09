import type { IAgentUsage } from './IAgentUsage';

/**
 * Um turno da conversa, como a própria CLI do agente o relatou; `costUsd` é null quando o
 * agente não disse.
 */
export interface IAgentTurn {
  sessionId: string | null;
  text: string;
  usage: IAgentUsage | null;
  isError: boolean;
  costUsd: number | null;
  wasCompacted?: boolean;
}
