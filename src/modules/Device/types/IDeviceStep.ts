import type { StepVerdict } from '@/modules/Run/types';

export interface IDeviceStep {
  number: number;
  action: string;
  verdict: StepVerdict;
}
