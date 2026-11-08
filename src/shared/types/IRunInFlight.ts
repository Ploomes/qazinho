import type { IRunAsked } from './IRunAsked';
import type { IRunFinding } from './IRunFinding';
import type { IRunQuestion } from './IRunQuestion';
import type { IRunScreen } from './IRunScreen';
import type { IStepOutcome } from './IStepOutcome';
import type { RunHow } from './RunHow';
import type { TargetKind } from './TargetKind';

/**
 * Uma run ou exploração que a main ainda anda, como está agora, com a pergunta que o
 * agente espera: o que uma página recém-aberta precisa para retomá-la.
 */
export interface IRunInFlight {
  workspaceId: string;
  runId: string;
  startedAtMs: number;
  doingIndex: number;
  how?: RunHow;
  streamUrl: string | null;
  address: string | null;
  screens?: IRunScreen[];
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
