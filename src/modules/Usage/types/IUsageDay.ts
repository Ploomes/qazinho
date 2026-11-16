/** O gasto de um dia, pela data local dele, mesmo um dia sem gasto. */
export interface IUsageDay {
  day: string;
  costUsd: number;
  tokens: number;
}
