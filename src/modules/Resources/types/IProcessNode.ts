/** One line of the resource tree: a project, a workspace, or something actually running. */
export interface IProcessNode {
  id: string;
  name: string;
  level: 0 | 1 | 2;
  cpu: number;
  ramGb: number;
  canShutDown: boolean;
}
