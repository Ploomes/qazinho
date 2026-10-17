import type { StepVerdict } from '@/modules/Run';

export interface IVerdictMessage {
  id: string;
  kind: 'verdict';
  at: string;
  verdict: StepVerdict;
  text: string;
  expected: string | null;
  got: string | null;
}
