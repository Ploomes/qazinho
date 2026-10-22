/** A Jira issue by its key, what it is called, and where it opens. */
export interface IJiraIssueRef {
  key: string;
  summary: string;
  url: string;
}
