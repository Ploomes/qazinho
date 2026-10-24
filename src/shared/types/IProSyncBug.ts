import type { IFiledIssue } from './IFiledIssue';
import type { Severity } from './Severity';

/** A bug as it goes to QAzinho Pro: its words, where it broke, its screens as files in the archive, each time it was seen, and its issue. */
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
  sightings: {
    runId: string;
    runWhen: string | null;
    caseId: string;
    stepNumber: number;
    shotFile: string | null;
    at: number | null;
  }[];
  firstSeenAt: string;
}
