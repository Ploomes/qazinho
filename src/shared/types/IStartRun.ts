import type { IFlatStep } from './IFlatStep';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IViewport } from './IViewport';
import type { Language } from './Language';
import type { RunMode } from './RunMode';

/** Everything the main process needs to walk a plan on a real device; `mode` "agent" walks every case with the agent, even one a recipe could walk again, the project's variables are typed where a step names them, and an exploration goes on for `minutes`. */
export interface IStartRun {
  workspaceId: string;
  projectId?: string;
  agentId: string;
  model: string;
  target: ITargetUnderTest;
  runId: string;
  steps: IFlatStep[];
  language: Language;
  viewport?: IViewport;
  pixelRatio?: number;
  mode?: RunMode;
  minutes?: number;
}
