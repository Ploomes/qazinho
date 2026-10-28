/**
 * O que o runner de git precisa: onde procurar o git, do jeito que o shell do próprio QA
 * procuraria.
 */
export interface IGitCli {
  directories: () => Promise<string[]>;
}
