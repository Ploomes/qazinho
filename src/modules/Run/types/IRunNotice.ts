/**
 * A run that just ended, said inside the app; `key` is new each time, so a second notice
 * replaces the first.
 */
export interface IRunNotice {
  key: string;
  workspaceId: string;
  runId: string;
}
