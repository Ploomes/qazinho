import type { GithubFailure } from './GithubFailure';
import type { JiraFailure } from './JiraFailure';
import type { RunFailure } from './RunFailure';

/**
 * Why a chat turn stopped short: what stops a run too, the QA stopping the answer
 * themselves, GitHub not handing over the code, Jira the story, or Confluence the page.
 */
export type ChatFailure =
  | RunFailure
  | { reason: 'stopped' }
  | { reason: 'code'; failure: GithubFailure; said: string }
  | { reason: 'jira'; failure: JiraFailure; key: string }
  | { reason: 'confluence'; failure: JiraFailure; said: string };
