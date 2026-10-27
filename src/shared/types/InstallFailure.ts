/** Why an install did not finish, for the page to say in the QA's language. */
export type InstallFailure =
  | { reason: 'busy' }
  | { reason: 'missing'; tool: string }
  | { reason: 'stopped'; tool: string; code: number }
  | { reason: 'said'; text: string }
  | { reason: 'no-bridge' };
