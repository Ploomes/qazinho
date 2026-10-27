/**
 * What the agent wrote to send its change: the commit message, and the pull request's
 * title and description.
 */
export interface ISuiteChangeMessage {
  commit: string;
  title: string;
  body: string;
}
