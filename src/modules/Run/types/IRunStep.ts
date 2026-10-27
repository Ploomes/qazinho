import type { IRunSpan } from './IRunSpan';
import type { StepVerdict } from '@/shared/types';

/**
 * How one step went: the agent's note when it did not pass, when it was walked, and how.
 */
export interface IRunStep {
  number: number;
  action: string;
  verdict: StepVerdict;
  why: string | null;
  bugId: string | null;
  shot: string | null;
  shotFile: string | null;
  span: IRunSpan | null;
  by?: 'replay' | 'healed';
  proof?: string;
}
