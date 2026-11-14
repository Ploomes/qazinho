/** A coluna do board do Jira em que uma história do projeto chegou para teste. */
export interface IReadyColumn {
  boardId: number;
  board: string;
  column: string;
}
