import type { TargetKind } from '@/shared/types';

/**
 * Who walks a run and on what: the agent, the model it was told to use (null for its own
 * default), and the kind of target.
 */
export interface IWalkedBy {
  agent: string;
  modelName: string | null;
  targetKind: TargetKind;
}
