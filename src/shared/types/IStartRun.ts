import type { IFlatStep } from './IFlatStep';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IViewport } from './IViewport';
import type { Language } from './Language';

/** Everything the main process needs to walk a plan on a real device. */
export interface IStartRun {
  workspaceId: string;
  agentId: string;
  model: string;
  target: ITargetUnderTest;
  runId: string;
  steps: IFlatStep[];
  language: Language;
  viewport?: IViewport;
  pixelRatio?: number;
}
