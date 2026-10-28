/** Uma linha da árvore de recursos: um projeto, um workspace, ou algo de fato rodando. */
export interface IProcessNode {
  id: string;
  name: string;
  level: 0 | 1 | 2;
  cpu: number;
  ramGb: number;
  workspaceId: string | null;
  canShutDown: boolean;
}
