/** What the agent reported. A window it never mentioned is null, which is not the same as zero. */
export interface IAgentUsage {
  fiveHourUsed: number | null;
  sevenDayUsed: number | null;
  resetsAt: number;
  contextTokens: number;
  contextWindow: number;
}
