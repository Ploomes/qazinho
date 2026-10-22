import type { FilingRow } from './FilingRow';
import type { FilingRowState } from './FilingRowState';
import type { BugFiling, IssueTarget } from '@/shared/types';

/** A bug on its way to the QA's tracker as the popup shows it: where it goes, the story it links to, how many screens go along, each step and where it stands, and how it ended. */
export interface IBugFiling {
  filingId: string;
  bugId: string;
  target: IssueTarget;
  story: string | null;
  shots: number;
  steps: { row: FilingRow; state: FilingRowState }[];
  result: BugFiling | null;
}
