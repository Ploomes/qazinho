/** What a failed Codex turn means to the QA: a signed-out Codex is the common one, and it has a fix. */
export function codexFailure(message: string): string {
  return /401|unauthori[sz]ed|not logged in/i.test(message)
    ? 'Codex is not signed in. Run codex login in a terminal, then try again.'
    : message;
}
