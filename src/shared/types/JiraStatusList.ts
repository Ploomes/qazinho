import type { IJiraStatus } from './IJiraStatus';
import type { JiraFailure } from './JiraFailure';

/** Os status do site do Jira do QA, ou por que o Jira não os listou. */
export type JiraStatusList =
  { isListed: true; statuses: IJiraStatus[] } | { isListed: false; failure: JiraFailure };
