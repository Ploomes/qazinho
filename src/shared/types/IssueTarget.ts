/** Where the QA files a project's bugs: a Jira project by its key, or a GitHub repository. */
export type IssueTarget =
  | { tracker: 'jira'; project: string }
  | { tracker: 'github'; owner: string; name: string };
