/**
 * Um plano que o QA pediu a partir de uma história do Jira: a chave, como se chama, e
 * onde ela abre.
 */
export interface IJiraCommand {
  id: 'jira-plan';
  key: string;
  summary: string;
  url: string;
}
