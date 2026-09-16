import type { IFlatStep } from './IFlatStep';
import type { ITargetUnderTest } from './ITargetUnderTest';

/** Everything the main process needs to walk a plan on a real device. */
export interface IStartRun {
  workspaceId: string;
  agentId: string;
  model: string;
  sessionId: string | null;
  target: ITargetUnderTest;
  runId: string;
  steps: IFlatStep[];
}
