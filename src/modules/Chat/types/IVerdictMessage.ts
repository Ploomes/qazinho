import type { StepVerdict } from '@/modules/Run';

/**
 * Um passo de uma run que não se sustentou; `runId` é null para um salvo antes de o chat
 * manter as runs juntas.
 */
export interface IVerdictMessage {
  id: string;
  kind: 'verdict';
  runId: string | null;
  at: string;
  verdict: StepVerdict;
  stepNumber: number;
  action: string;
  expected: string | null;
  got: string | null;
}
