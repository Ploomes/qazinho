import type { IBugReproStep } from './IBugReproStep';
import type { IBugShot } from './IBugShot';
import type { Severity } from '@/shared/types';

/** A failed step the agent could explain, with everything a developer needs to reproduce it. */
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
  seenRuns: number;
  repro: IBugReproStep[];
  shots: IBugShot[];
  isNew: boolean;
}
