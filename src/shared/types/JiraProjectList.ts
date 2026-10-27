import type { IJiraProject } from './IJiraProject';
import type { JiraFailure } from './JiraFailure';

/**
 * The Jira projects the QA can see, the ones they opened last first, or why Jira did not
 * answer.
 */
export type JiraProjectList =
  | { isListed: true; projects: IJiraProject[] }
  | { isListed: false; failure: JiraFailure };
