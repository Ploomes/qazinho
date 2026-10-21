import type { ReplayFocus } from './ReplayFocus';

/** The run whose recording is playing, and what it opened on. */
export interface IReplayOpen {
  workspaceId: string;
  runId: string;
  focus: ReplayFocus;
}
