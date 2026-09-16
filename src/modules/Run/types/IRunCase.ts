import type { IRunStep } from './IRunStep';
import type { StepVerdict } from './StepVerdict';

export interface IRunCase {
  id: string;
  title: string;
  verdict: StepVerdict;
  durationSec: number;
  steps: IRunStep[];
}
