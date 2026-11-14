import type { IJiraBoard } from './IJiraBoard';
import type { JiraFailure } from './JiraFailure';

/** Os boards do Jira do QA, ou por que o Jira não os listou. */
export type JiraBoardList =
  { isListed: true; boards: IJiraBoard[] } | { isListed: false; failure: JiraFailure };
