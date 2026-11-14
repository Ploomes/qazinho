/**
 * O quanto de um plano já foi desenvolvido: o que anda sem IA, o que ainda falta, e os
 * casos que o QA faz à mão, fora das duas contas.
 */
export interface IPlanStage {
  total: number;
  developed: string[];
  toDevelop: string[];
  manual: string[];
}
