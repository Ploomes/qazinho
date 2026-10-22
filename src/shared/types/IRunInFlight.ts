import type { IRunAsked } from './IRunAsked';
import type { IRunFinding } from './IRunFinding';
import type { IRunQuestion } from './IRunQuestion';
import type { IStepOutcome } from './IStepOutcome';
import type { TargetKind } from './TargetKind';

/** A run main is still walking, or an exploration it is still on, as it stands now, with the question its agent waits on: what a page that just opened needs to pick it up. */
export interface IRunInFlight {
  workspaceId: string;
  runId: string;
  startedAtMs: number;
  doingIndex: number;
  streamUrl: string | null;
  outcomes: IStepOutcome[];
  isPaused: boolean;
  costUsd: number | null;
  findings: IRunFinding[];
  agentId: string;
  model: string;
  targetKind: TargetKind;
  isExploring: boolean;
  question: IRunQuestion | null;
  asked: IRunAsked[];
}
