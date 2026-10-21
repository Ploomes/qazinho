import type { Severity } from '@/shared/types';

/** A bug pinned to the moment of the video it was caught. */
export interface IReplayMark {
  bugId: string;
  title: string;
  severity: Severity;
  atMs: number;
  caseId: string;
  stepNumber: number;
}
