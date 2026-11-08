import type { IDraftedCase } from './IDraftedCase';
import type { IRunAsked } from './IRunAsked';
import type { IRunFinding } from './IRunFinding';
import type { IRunQuestion } from './IRunQuestion';
import type { IRunScreen } from './IRunScreen';
import type { IRunVideo } from './IRunVideo';
import type { IStepOutcome } from './IStepOutcome';
import type { RunFailure } from './RunFailure';
import type { RunHow } from './RunHow';

/**
 * O que a página ouve enquanto uma run real anda o dispositivo, ou uma exploração
 * percorre o app, as perguntas do agente ao QA incluídas.
 */
export type IRunEvent =
  | { kind: 'step'; outcome: IStepOutcome }
  | { kind: 'doing'; workspaceId: string; index: number; how: RunHow }
  | { kind: 'recorded'; workspaceId: string; caseId: string }
  | { kind: 'heard'; workspaceId: string }
  | { kind: 'replied'; workspaceId: string; text: string | null }
  | { kind: 'unheard'; workspaceId: string; texts: string[] }
  | { kind: 'streaming'; workspaceId: string; url: string }
  | { kind: 'address'; workspaceId: string; url: string }
  | { kind: 'screens'; workspaceId: string; screens: IRunScreen[] }
  | { kind: 'note'; workspaceId: string; text: string }
  | { kind: 'cost'; workspaceId: string; costUsd: number }
  | { kind: 'finding'; workspaceId: string; finding: IRunFinding }
  | { kind: 'asked'; workspaceId: string; question: IRunQuestion }
  | { kind: 'answered'; workspaceId: string; asked: IRunAsked }
  | { kind: 'done'; workspaceId: string }
  | { kind: 'explored'; workspaceId: string; summary: string; cases: IDraftedCase[] }
  | { kind: 'video'; workspaceId: string; runId: string; video: IRunVideo }
  | { kind: 'failed'; workspaceId: string; failure: RunFailure };
