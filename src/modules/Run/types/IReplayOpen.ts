import type { ReplayFocus } from './ReplayFocus';

/** A run cuja gravação está tocando, e em que ela abriu. */
export interface IReplayOpen {
  workspaceId: string;
  runId: string;
  focus: ReplayFocus;
}
