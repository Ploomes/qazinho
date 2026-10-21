import type { BuildPhase } from './BuildPhase';
import type { BuildPlatform, BuildStep, IBuildResult } from '@/shared/types';

/** A build as the page follows it: what it builds from where and for which project, how far it got, the last things its agent did, and how it ended. */
export interface IBuild {
  id: string;
  projectId: string | null;
  platform: BuildPlatform;
  repository: string;
  branch: string;
  startedAt: number;
  phase: BuildPhase;
  step: BuildStep;
  bytes: number;
  lines: string[];
  result: IBuildResult | null;
}
