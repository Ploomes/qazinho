/** What the agent said about a step while it walked a run, kept with that run. */
export interface INoteMessage {
  id: string;
  kind: 'note';
  at: string;
  runId: string;
  who: string;
  text: string;
}
