/** Uma run andando para o ícone: os passos que tem, os que andaram, e se espera o QA. */
export interface IDockRun {
  total: number;
  walked: number[];
  failed: number[];
  asking: boolean;
}
