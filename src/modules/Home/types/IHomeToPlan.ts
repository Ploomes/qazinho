/** Uma história da sprint aberta de um projeto que ainda não tem plano. */
export interface IHomeToPlan {
  kind: 'toPlan';
  projectId: string;
  project: string;
  sprint: string;
  key: string;
  title: string;
  status: string;
  url: string;
}
