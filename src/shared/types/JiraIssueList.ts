import type { IJiraIssueRef } from './IJiraIssueRef';
import type { JiraFailure } from './JiraFailure';

/** As issues que o Jira achou para o que o QA digitou, ou por que ele não respondeu. */
export type JiraIssueList =
  { isListed: true; issues: IJiraIssueRef[] } | { isListed: false; failure: JiraFailure };
