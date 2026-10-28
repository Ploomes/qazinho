import type { GithubFailure } from './GithubFailure';
import type { JiraFailure } from './JiraFailure';
import type { RunFailure } from './RunFailure';

/**
 * Por que um turno de chat parou no meio: o que para uma run, o QA parando a resposta, ou
 * o GitHub, o Jira ou o Confluence não entregando o código, a história ou a página.
 */
export type ChatFailure =
  | RunFailure
  | { reason: 'stopped' }
  | { reason: 'code'; failure: GithubFailure; said: string }
  | { reason: 'jira'; failure: JiraFailure; key: string }
  | { reason: 'confluence'; failure: JiraFailure; said: string };
