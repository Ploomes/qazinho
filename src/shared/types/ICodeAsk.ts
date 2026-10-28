/**
 * Uma branch de um repositório de onde planejar, e a branch base contra a qual as
 * mudanças dela são medidas.
 */
export interface ICodeAsk {
  owner: string;
  name: string;
  base: string;
  branch: string;
}
