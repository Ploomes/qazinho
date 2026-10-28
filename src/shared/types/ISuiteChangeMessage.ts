/**
 * O que o agente escreveu para mandar a mudança: a mensagem de commit, e o título e a
 * descrição do pull request.
 */
export interface ISuiteChangeMessage {
  commit: string;
  title: string;
  body: string;
}
