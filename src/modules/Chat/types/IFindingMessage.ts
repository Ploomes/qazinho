/** A bug the run's agent filed on the side of a step, as the run's section in the chat shows it. */
export interface IFindingMessage {
  id: string;
  kind: 'finding';
  at: string;
  runId: string;
  bugId: string;
  title: string;
}
