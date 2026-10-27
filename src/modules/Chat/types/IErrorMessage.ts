/**
 * QAzinho itself broke: the agent died, the device never came up. Never a test result;
 * `runId` is the run it stopped.
 */
export interface IErrorMessage {
  id: string;
  kind: 'error';
  runId: string | null;
  at: string;
  text: string;
  fix: string | null;
}
