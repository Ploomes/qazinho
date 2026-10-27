import type { IDesignLink } from './IDesignLink';
import type { IFlatStep } from './IFlatStep';
import type { IKnownBug } from './IKnownBug';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IViewport } from './IViewport';
import type { Language } from './Language';
import type { RunMode } from './RunMode';

/** Everything main needs to walk a plan on a real device, or explore with no plan. */
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
