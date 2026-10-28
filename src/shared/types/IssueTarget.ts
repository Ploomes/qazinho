/**
 * Onde o QA registra os bugs de um projeto: um projeto do Jira pela chave, ou um
 * repositório do GitHub.
 */
export type IssueTarget =
  | { tracker: 'jira'; project: string }
  | { tracker: 'github'; owner: string; name: string };
