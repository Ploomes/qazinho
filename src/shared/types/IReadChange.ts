import type { IChangeBrief } from './IChangeBrief';

/** O que a página pede à main para propor as trocas de uma mudança nas fontes. */
export interface IReadChange {
  workspaceId: string;
  agentId: string;
  model: string;
  brief: IChangeBrief;
}
