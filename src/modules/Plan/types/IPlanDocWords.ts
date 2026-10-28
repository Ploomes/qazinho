import type { StepVerdict } from '@/shared/types';

/** As palavras em que um plano publicado é escrito, no idioma que o QA lê. */
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
