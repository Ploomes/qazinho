import type { BuildPhase } from './BuildPhase';
import type { BuildPlatform, BuildStep, IBuildResult } from '@/shared/types';

/**
 * Um build como a página o acompanha: o que constrói, de onde e para qual projeto, até
 * onde chegou, as últimas coisas que o agente fez, e como terminou.
 */
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
