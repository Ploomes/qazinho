/** Why an install did not finish, for the page to say in the QA's language: it was already going, a tool it needs is missing, a step stopped with no word, or what the tool itself printed. */
export type InstallFailure =
  | { reason: 'busy' }
  | { reason: 'missing'; tool: string }
  | { reason: 'stopped'; tool: string; code: number }
  | { reason: 'said'; text: string }
  | { reason: 'no-bridge' };
