/** What the agent reported about the account's limits and the turn's context. */
export interface IAgentUsage {
  fiveHourUsed: number;
  sevenDayUsed: number;
  resetsAt: number;
  contextTokens: number;
  contextWindow: number;
}
