/**
 * O código de onde um plano foi feito: o repositório, a branch no commit dela, e a base
 * contra a qual foi medida.
 */
export interface ICodeSource {
  repository: string;
  branch: string;
  base: string;
  commit: string;
}
