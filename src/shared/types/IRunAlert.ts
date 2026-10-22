/** A run that ended, or whose agent asks the QA something, said in their language, for main to call them back with while they are away. */
export interface IRunAlert {
  workspaceId: string;
  runId: string;
  title: string;
  body: string;
}
