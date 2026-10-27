import type { IssueSource } from './IssueSource';

/**
 * The ticket a workspace works from, and where it opens. It is where the expected result
 * comes from.
 */
export interface IIssue {
  key: string;
  title: string;
  source: IssueSource;
  url: string;
}
