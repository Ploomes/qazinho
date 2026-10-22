import type { FilingFailure } from './FilingFailure';
import type { IFiledIssue } from './IFiledIssue';

/** How sending a bug went: the issue it became, the files its tracker did not take and the story it was linked to, or why no issue was made, in the tracker's words. */
export type BugFiling =
  | { isFiled: true; issue: IFiledIssue; missed: string[]; linked: string | null }
  | { isFiled: false; failure: FilingFailure; said: string };
