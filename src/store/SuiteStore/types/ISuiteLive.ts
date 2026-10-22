/** A run going on a project's suite: its id, and the tests running right now, each with the step it is on. */
export interface ISuiteLive {
  runId: string;
  going: Record<string, string | null>;
}
