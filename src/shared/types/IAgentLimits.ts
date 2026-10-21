/** How far the QA's account is into its limits: the five-hour session and the week, each from 0 to 1, and when the session renews as a unix second. */
export interface IAgentLimits {
  fiveHourUsed: number | null;
  sevenDayUsed: number | null;
  resetsAt: number;
}
