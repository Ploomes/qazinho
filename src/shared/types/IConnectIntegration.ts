/**
 * O que conectar um tracker leva: nada para o GitHub, que passa pelo gh do próprio QA;
 * para o Jira, o que o QA digitou.
 */
export type IConnectIntegration =
  { id: 'github' } | { id: 'jira'; site: string; email: string; token: string };
