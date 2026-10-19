import type { IBugReproStep } from './IBugReproStep';
import type { IBugShot } from './IBugShot';
import type { Severity } from '@/shared/types';

/** A failed step the agent could explain, or a bug it saw on the side of one, with everything a developer needs to reproduce it and when it was caught. */
export interface IBug {
  id: string;
  severity: Severity;
  title: string;
  body: string;
  expected: string;
  got: string;
  runId: string;
  runWhen: string;
  caseId: string;
  caseTitle: string;
  stepNumber: number;
  target: string;
  agent: string;
  modelName: string | null;
  seenRuns: number;
  repro: IBugReproStep[];
  shots: IBugShot[];
  isNew: boolean;
  isIncidental: boolean;
  at: number | null;
}
