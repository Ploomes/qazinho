/** A plan the QA asked for from a Jira story: its key, what it is called, and where it opens. */
export interface IJiraCommand {
  id: 'jira-plan';
  key: string;
  summary: string;
  url: string;
}
