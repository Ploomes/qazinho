/** Um caso de um plano como vai ao QAzinho Pro: o que cobre, os passos, e se é à mão. */
export interface IProSyncCase {
  id: string;
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  goal: string;
  preconditions: string;
  steps: { action: string; expected: string; frame?: string }[];
  isManual?: boolean;
}
