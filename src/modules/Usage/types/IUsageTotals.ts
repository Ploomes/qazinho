/** O gasto somado de um período: o custo que o agente disse, e os tokens de cada tipo. */
export interface IUsageTotals {
  costUsd: number;
  hasCost: boolean;
  hasUnpriced: boolean;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  tokens: number;
}
