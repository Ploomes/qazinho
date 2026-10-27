import type { IBugReproStep } from './IBugReproStep';
import type { IBugReview } from './IBugReview';
import type { IBugShot } from './IBugShot';
import type { IBugSighting } from './IBugSighting';
import type { IFiledIssue, Severity } from '@/shared/types';

/**
 * A bug the agent caught, with what a developer needs to reproduce it, its sightings and
 * its issue.
 */
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
  isDismissed: boolean;
  at: number | null;
  filed: IFiledIssue | null;
  reviewedRuns: string[];
  review: IBugReview | null;
  frame: string | null;
}
