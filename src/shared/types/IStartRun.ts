import type { IFlatStep } from './IFlatStep';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IViewport } from './IViewport';

/** Everything the main process needs to walk a plan on a real device. */
export interface IStartRun {
  workspaceId: string;
  agentId: string;
  model: string;
  target: ITargetUnderTest;
  runId: string;
  steps: IFlatStep[];
  viewport?: IViewport;
}
