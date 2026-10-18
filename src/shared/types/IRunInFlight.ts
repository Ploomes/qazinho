import type { IStepOutcome } from './IStepOutcome';
import type { TargetKind } from './TargetKind';

/** A run main is still walking, as it stands now: what a page that just opened needs to pick it up. */
export interface IRunInFlight {
  workspaceId: string;
  runId: string;
  startedAtMs: number;
  doingIndex: number;
  streamUrl: string | null;
  outcomes: IStepOutcome[];
  isPaused: boolean;
  costUsd: number | null;
  agentId: string;
  model: string;
  targetKind: TargetKind;
}
