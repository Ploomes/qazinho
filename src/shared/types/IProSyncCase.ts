/**
 * Um caso de um plano como vai ao QAzinho Pro: o que cobre, os passos, se é à mão, de
 * onde vem o esperado e as dúvidas que o seguram.
 */
export interface IProSyncCase {
  id: string;
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  goal: string;
  preconditions: string;
  steps: { action: string; expected: string; frame?: string }[];
  isManual?: boolean;
  sources?: string[];
  blockedBy?: string[];
}
