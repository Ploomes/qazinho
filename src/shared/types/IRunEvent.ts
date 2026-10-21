import type { IDraftedCase } from './IDraftedCase';
import type { IRunFinding } from './IRunFinding';
import type { IRunVideo } from './IRunVideo';
import type { IStepOutcome } from './IStepOutcome';
import type { RunFailure } from './RunFailure';

/** What the page hears while a real run walks the device, or an exploration goes through the app. */
export type IRunEvent =
  | { kind: 'step'; outcome: IStepOutcome }
  | { kind: 'doing'; workspaceId: string; index: number }
  | { kind: 'streaming'; workspaceId: string; url: string }
  | { kind: 'note'; workspaceId: string; text: string }
  | { kind: 'cost'; workspaceId: string; costUsd: number }
  | { kind: 'finding'; workspaceId: string; finding: IRunFinding }
  | { kind: 'done'; workspaceId: string }
  | { kind: 'explored'; workspaceId: string; summary: string; cases: IDraftedCase[] }
  | { kind: 'video'; workspaceId: string; runId: string; video: IRunVideo }
  | { kind: 'failed'; workspaceId: string; failure: RunFailure };
