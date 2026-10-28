/** Um caso de um plano como vai ao QAzinho Pro: o que cobre, e os passos. */
export interface IProSyncCase {
  id: string;
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  goal: string;
  preconditions: string;
  steps: { action: string; expected: string; frame?: string }[];
}
