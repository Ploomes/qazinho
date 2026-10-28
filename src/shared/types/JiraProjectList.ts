import type { IJiraProject } from './IJiraProject';
import type { JiraFailure } from './JiraFailure';

/**
 * Os projetos do Jira que o QA pode ver, os abertos por último primeiro, ou por que o
 * Jira não respondeu.
 */
export type JiraProjectList =
  | { isListed: true; projects: IJiraProject[] }
  | { isListed: false; failure: JiraFailure };
