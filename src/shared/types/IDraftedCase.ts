/** One case as the agent drafted it in a chat answer, before the plan gives it an id. */
export interface IDraftedCase {
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  goal: string;
  preconditions: string;
  steps: { action: string; expected: string }[];
}
