/** A case of a plan as it goes to QAzinho Pro: what it covers, and its steps. */
export interface IProSyncCase {
  id: string;
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  goal: string;
  preconditions: string;
  steps: { action: string; expected: string; frame?: string }[];
}
