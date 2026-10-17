/** What the QA types to connect a tracker. It crosses to main once and never comes back. */
export type IConnectIntegration =
  | { id: 'github'; token: string }
  | { id: 'jira'; site: string; email: string; token: string };
