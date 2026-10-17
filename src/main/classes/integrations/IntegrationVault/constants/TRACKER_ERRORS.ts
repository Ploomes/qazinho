/** What the QA reads when a tracker refuses, by what went wrong. */
export const TRACKER_ERRORS = {
  unauthorized:
    'The tracker did not accept these credentials. Check the token and try again.',
  unreachable:
    'QAzinho could not reach the tracker from this machine. Check the address and the network.',
  unexpected: 'The tracker answered in a way QAzinho did not expect (HTTP {status}).',
  noKeychain:
    'This machine has no keychain QAzinho can seal a token with, so it will not store one.',
  badSite:
    'That does not look like a Jira site. Use the address you open Jira at, like acme.atlassian.net.',
} as const;
