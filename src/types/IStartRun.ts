import type { IFlatStep } from './IFlatStep';

/** Everything the main process needs to walk a plan on a real device. */
export interface IStartRun {
  workspaceId: string;
  agentId: string;
  model: string;
  sessionId: string | null;
  url: string;
  runId: string;
  steps: IFlatStep[];
}
