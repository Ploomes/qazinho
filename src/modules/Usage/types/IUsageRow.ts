/** O gasto de uma parte, como um projeto: null no custo quando nada o disse. */
export interface IUsageRow {
  key: string;
  costUsd: number | null;
  tokens: number;
}
