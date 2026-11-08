/** O quanto de um plano já foi desenvolvido: o que anda sem IA e o que ainda falta. */
export interface IPlanStage {
  total: number;
  developed: string[];
  toDevelop: string[];
}
