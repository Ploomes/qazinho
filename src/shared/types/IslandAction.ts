/** Um pedido do QA na ilha: parar a run de um workspace, ou abri-lo no app. */
export interface IIslandAction {
  kind: 'stop' | 'open';
  workspaceId: string;
}
