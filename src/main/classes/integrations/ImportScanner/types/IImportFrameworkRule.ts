/** Como se reconhece um framework de teste: a config, os pacotes e os testes dele. */
export interface IImportFrameworkRule {
  id: string;
  config: RegExp;
  packages: string[];
  tests: RegExp;
}
