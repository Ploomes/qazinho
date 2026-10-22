import type { IBugReproStep } from './IBugReproStep';
import type { IBugReview } from './IBugReview';
import type { IBugShot } from './IBugShot';
import type { IBugSighting } from './IBugSighting';
import type { IFiledIssue, Severity } from '@/shared/types';

/** A failed step the agent could explain, or a bug it saw on the side of one, with all a developer needs to reproduce it, when it was caught, each time it was caught again, the issue it became in the QA's tracker, the runs already weighed against that issue, and the latest look at it. */
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
  filed: IFiledIssue | null;
  reviewedRuns: string[];
  review: IBugReview | null;
}
