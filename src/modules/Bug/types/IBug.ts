import type { IBugReproStep } from './IBugReproStep';
import type { IBugShot } from './IBugShot';
import type { Severity } from './Severity';

/** A failed step the agent could explain, with everything a developer needs to reproduce it. */
export interface IBug {
  id: string;
  severity: Severity;
  title: string;
  body: string;
  expected: string;
  got: string;
  observed: string;
  runId: string;
  runWhen: string;
  caseId: string;
  step: string;
  target: string;
  build: string;
  seen: string;
  clipRatio: string;
  clipLength: string;
  repro: IBugReproStep[];
  shots: IBugShot[];
  isNew: boolean;
}
