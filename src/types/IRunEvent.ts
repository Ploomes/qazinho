import type { IStepOutcome } from './IStepOutcome';

/** What the page hears while a real run walks the device. */
export type IRunEvent =
  | { kind: 'step'; outcome: IStepOutcome }
  | { kind: 'doing'; workspaceId: string; index: number }
  | { kind: 'done'; workspaceId: string }
  | { kind: 'failed'; workspaceId: string; text: string };
