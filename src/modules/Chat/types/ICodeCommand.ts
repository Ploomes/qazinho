/**
 * Um plano que o QA pediu a partir de uma branch de um repositório, medido contra a
 * branch base dela.
 */
export interface ICodeCommand {
  id: 'code-plan';
  repository: string;
  branch: string;
  base: string;
}
