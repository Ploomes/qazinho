import type { ILiveQuestion } from './ILiveQuestion';
import type { IWalkedBy } from './IWalkedBy';
import type { IRunSuggestion } from '@/modules/Run/types';
import type { IRunAsked, IStepOutcome } from '@/shared/types';

/**
 * A run em andamento: o passo, o tempo, o que ela decidiu, e as perguntas que o agente
 * dela fez.
 */
export interface ILiveRun {
  id: string;
  doingIndex: number;
  isRunning: boolean;
  isDone: boolean;
  elapsedSec: number;
  startedAt: string;
  startedAtMs?: number;
  outcomes: IStepOutcome[];
  shot: string | null;
  streamUrl: string | null;
  address?: string;
  costUsd: number | null;
  by: IWalkedBy;
  kind?: 'explore';
  caseIds?: string[];
  suggestion?: IRunSuggestion;
  question?: ILiveQuestion;
  asked?: IRunAsked[];
}
