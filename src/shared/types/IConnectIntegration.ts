/**
 * What connecting a tracker takes: nothing for GitHub, which goes through the QA's own
 * gh; for Jira, what the QA typed.
 */
export type IConnectIntegration =
  { id: 'github' } | { id: 'jira'; site: string; email: string; token: string };
