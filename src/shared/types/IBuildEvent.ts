import type { BuildStep } from './BuildStep';
import type { IBuildResult } from './IBuildResult';

/** What reaches the page while a build goes: the step it is on, a line of what the agent does, and how it ended. */
export type IBuildEvent =
  | { kind: 'step'; buildId: string; step: BuildStep; bytes: number }
  | { kind: 'line'; buildId: string; text: string }
  | { kind: 'ended'; buildId: string; result: IBuildResult };
