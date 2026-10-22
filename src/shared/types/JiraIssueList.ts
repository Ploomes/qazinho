import type { IJiraIssueRef } from './IJiraIssueRef';
import type { JiraFailure } from './JiraFailure';

/** The issues Jira found for what the QA typed, or why it did not answer. */
export type JiraIssueList =
  { isListed: true; issues: IJiraIssueRef[] } | { isListed: false; failure: JiraFailure };
