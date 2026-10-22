import type { IDesignLink } from './IDesignLink';
import type { IFlatStep } from './IFlatStep';
import type { IKnownBug } from './IKnownBug';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IViewport } from './IViewport';
import type { Language } from './Language';
import type { RunMode } from './RunMode';

/** Everything the main process needs to walk a plan on a real device: `mode` "agent" walks every case with the agent, an exploration goes on for `minutes`, `bugs` are the ones already open, told to each agent so it counts one seen again instead of filing it twice, and `design` is the Figma design its steps' frames belong to. */
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
  bugs?: IKnownBug[];
  design?: IDesignLink | null;
}
