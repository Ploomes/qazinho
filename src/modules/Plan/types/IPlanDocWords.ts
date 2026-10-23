import type { StepVerdict } from '@/shared/types';

/** The words a published plan is written in, in the language the QA reads. */
export interface IPlanDocWords {
  intro: (props: { cases: number; steps: number }) => string;
  story: string;
  page: string;
  design: string;
  lastRun: string;
  runLine: (props: { run: string; when: string }) => string;
  priority: string;
  goal: string;
  preconditions: string;
  action: string;
  expected: string;
  frame: string;
  result: string;
  verdicts: Record<StepVerdict, string>;
  keptBy: string;
}
