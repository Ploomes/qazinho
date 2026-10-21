import type { IRunSpan } from './IRunSpan';
import type { StepVerdict } from '@/shared/types';

/** How one step of a case went, with the note the agent left when it did not pass, when the device walked it, and whether it was walked again without the agent, with the words that proved it. */
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
