import type { IFiledIssue } from './IFiledIssue';
import type { IProSyncCatch } from './IProSyncCatch';
import type { Severity } from './Severity';

/**
 * Um bug como vai ao QAzinho Pro: as palavras, onde quebrou, as telas como arquivos no
 * archive, a run que o pegou primeiro, cada vista posterior, e a issue dele.
 */
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
