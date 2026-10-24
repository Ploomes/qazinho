/** What the QA should know about this computer's sending to its org: no answer, no org, an account that only reads, a blocked org, a role that only reads, a sign-in the org no longer takes, or a refusal. */
export type ProAttention =
  'unreachable' | 'no-org' | 'reader' | 'blocked' | 'read-only' | 'signed-out' | 'failed';
