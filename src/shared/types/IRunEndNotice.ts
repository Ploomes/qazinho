/** A run that ended, said in the QA's language, for main to call them back with while they are away. */
export interface IRunEndNotice {
  workspaceId: string;
  runId: string;
  title: string;
  body: string;
}
