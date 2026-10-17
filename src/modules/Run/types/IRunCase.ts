import type { IRunStep } from './IRunStep';
import type { StepVerdict } from '@/shared/types';

export interface IRunCase {
  id: string;
  title: string;
  verdict: StepVerdict;
  durationSec: number;
  steps: IRunStep[];
}
