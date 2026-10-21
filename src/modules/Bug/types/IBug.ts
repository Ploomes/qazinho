import type { IBugReproStep } from './IBugReproStep';
import type { IBugShot } from './IBugShot';
import type { IBugSighting } from './IBugSighting';
import type { Severity } from '@/shared/types';

/** A failed step the agent could explain, or a bug it saw on the side of one, with all a developer needs to reproduce it, when it was caught and each time it was caught again. */
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
  sightings: IBugSighting[];
  isNew: boolean;
  isIncidental: boolean;
  at: number | null;
}
