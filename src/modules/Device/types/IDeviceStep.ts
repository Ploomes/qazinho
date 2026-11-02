import type { StepVerdict } from '@/modules/Run';

export interface IDeviceStep {
  number: number;
  action: string;
  verdict: StepVerdict;
  caseId?: string;
  caseTitle?: string;
}
