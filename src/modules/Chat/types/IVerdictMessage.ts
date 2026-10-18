import type { StepVerdict } from '@/modules/Run';

export interface IVerdictMessage {
  id: string;
  kind: 'verdict';
  at: string;
  verdict: StepVerdict;
  stepNumber: number;
  action: string;
  expected: string | null;
  got: string | null;
}
