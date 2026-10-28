import type { TargetKind } from '@/shared/types';

/**
 * Quem anda uma run e em quê: o agente, o modelo que lhe mandaram usar (null para o
 * padrão dele), e o tipo de alvo.
 */
export interface IWalkedBy {
  agent: string;
  modelName: string | null;
  targetKind: TargetKind;
}
