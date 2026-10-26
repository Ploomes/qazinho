import type { IFiledIssue } from './IFiledIssue';
import type { IProSyncCatch } from './IProSyncCatch';
import type { Severity } from './Severity';

/** A bug as it goes to QAzinho Pro: its words, where it broke, its screens as files in the archive, the run that first caught it, each later sighting, and its issue. */
export interface IProSyncBug {
  workspaceId: string;
  bugId: string;
  severity: Severity;
  title: string;
  body: string;
  expected: string;
  got: string;
  caseId: string;
  caseTitle: string;
  stepNumber: number;
  target: string;
  isIncidental: boolean;
  isDismissed: boolean;
  filed: IFiledIssue | null;
  repro: { action: string; isBad: boolean }[];
  shots: { file: string | null; isBad: boolean }[];
  caught: IProSyncCatch | null;
  sightings: IProSyncCatch[];
  firstSeenAt: string;
}
