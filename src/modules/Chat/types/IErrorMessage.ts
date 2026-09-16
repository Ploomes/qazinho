/** gocrash itself broke: the agent died, the device never came up. Never a test result. */
export interface IErrorMessage {
  id: string;
  kind: 'error';
  at: string;
  text: string;
  fix: string | null;
}
