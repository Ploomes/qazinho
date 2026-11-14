import type { IConfluencePageRef, IJiraIssueRef } from '@/shared/types';

/** A história de que o primeiro plano parte: uma do Jira ou uma página do Confluence. */
export type ProjectStory =
  { kind: 'jira'; issue: IJiraIssueRef } | { kind: 'page'; page: IConfluencePageRef };
