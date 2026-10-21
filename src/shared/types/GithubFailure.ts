/** Why GitHub, or the GitHub CLI QAzinho talks to it through, did not answer as asked. */
export type GithubFailure =
  'no-cli' | 'signed-out' | 'denied' | 'not-found' | 'unreachable' | 'unexpected';
