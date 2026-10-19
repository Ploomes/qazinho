import type { IRunSpan } from './IRunSpan';
import type { StepVerdict } from '@/shared/types';

/** How one step of a case went, with the note the agent left when it did not pass, and when the device walked it. */
export interface IRunStep {
  number: number;
  action: string;
  verdict: StepVerdict;
  why: string | null;
  bugId: string | null;
  shot: string | null;
  shotFile: string | null;
  span: IRunSpan | null;
}
