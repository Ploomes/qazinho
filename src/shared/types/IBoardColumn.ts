/** Uma coluna de um board do Jira, com os status que caem nela. */
export interface IBoardColumn {
  name: string;
  statuses: string[];
}
