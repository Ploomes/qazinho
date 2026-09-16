import type { StepVerdict } from '@/types';

/** How one step of a case went, with the note the agent left when it did not pass. */
export interface IRunStep {
  number: number;
  action: string;
  verdict: StepVerdict;
  why: string | null;
  bugId: string | null;
  shot: string | null;
}
