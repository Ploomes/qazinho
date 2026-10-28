import type { IStepRecipe } from './IStepRecipe';
import type { TargetKind } from '@/shared/types';

/**
 * Um caso que uma run andou, guardado para andá-lo de novo sem o agente; vale enquanto o
 * caso disser o mesmo.
 */
export interface ICaseRecipe {
  caseId: string;
  fingerprint: string;
  targetKind: TargetKind;
  steps: IStepRecipe[];
  runId: string;
  recordedAt: number;
}
