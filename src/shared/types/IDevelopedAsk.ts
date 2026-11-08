import type { IFlatStep } from './IFlatStep';
import type { TargetKind } from './TargetKind';

/** Um plano como ele está agora, para saber quais casos dele já têm gravação. */
export interface IDevelopedAsk {
  workspaceId: string;
  steps: IFlatStep[];
  targetKind: TargetKind;
}
