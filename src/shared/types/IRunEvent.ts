import type { IStepOutcome } from './IStepOutcome';
import type { RunFailure } from './RunFailure';

/** What the page hears while a real run walks the device. */
export type IRunEvent =
  | { kind: 'step'; outcome: IStepOutcome }
  | { kind: 'doing'; workspaceId: string; index: number }
  | { kind: 'streaming'; workspaceId: string; url: string }
  | { kind: 'note'; workspaceId: string; text: string }
  | { kind: 'done'; workspaceId: string }
  | { kind: 'failed'; workspaceId: string; failure: RunFailure };
