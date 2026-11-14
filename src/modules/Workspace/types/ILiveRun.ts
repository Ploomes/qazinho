import type { ILiveQuestion } from './ILiveQuestion';
import type { IWalkedBy } from './IWalkedBy';
import type { IRunSuggestion } from '@/modules/Run/types';
import type {
  IManualTurn,
  IRunAsked,
  IRunScreen,
  IStepOutcome,
  RunHow,
  RunMode,
} from '@/shared/types';

/**
 * A run em andamento: o passo, o tempo, o que ela decidiu, as perguntas que o agente dela
 * fez, e a vez do QA num caso à mão.
 */
export interface ILiveRun {
  id: string;
  doingIndex: number;
  how?: RunHow;
  talk?: 'waiting' | 'checking';
  isRunning: boolean;
  isDone: boolean;
  elapsedSec: number;
  startedAt: string;
  startedAtMs?: number;
  outcomes: IStepOutcome[];
  shot: string | null;
  streamUrl: string | null;
  address?: string;
  screens?: IRunScreen[];
  costUsd: number | null;
  by: IWalkedBy;
  kind?: 'explore';
  caseIds?: string[];
  mode?: RunMode;
  suggestion?: IRunSuggestion;
  question?: ILiveQuestion;
  asked?: IRunAsked[];
  manual?: IManualTurn;
}
