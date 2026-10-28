/**
 * A suíte de Playwright que um projeto roda: o projeto, nenhum até ser criado, e os nomes
 * das variáveis dele, que chegam aos testes como configurações.
 */
export interface ISuiteFieldProps {
  projectId: string | null;
  variableNames: string[];
}
