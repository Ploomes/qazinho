/**
 * O que o QA pediu para rodar: a suíte inteira, tudo sob uma pasta ou num arquivo, ou
 * alguns testes pelo id.
 */
export type SuiteScope =
  { kind: 'all' } | { kind: 'path'; path: string } | { kind: 'tests'; testIds: string[] };
