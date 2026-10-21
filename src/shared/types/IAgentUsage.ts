import type { IAgentLimits } from './IAgentLimits';

/** What the agent reported. A window it never mentioned is null, which is not the same as zero. */
export interface IAgentUsage extends IAgentLimits {
  contextTokens: number;
  contextWindow: number;
}
