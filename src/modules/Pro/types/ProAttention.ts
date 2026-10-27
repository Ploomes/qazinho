/**
 * What the QA should know about sending to the org: no answer, no org, read-only, blocked
 * or refused.
 */
export type ProAttention =
  'unreachable' | 'no-org' | 'reader' | 'blocked' | 'read-only' | 'signed-out' | 'failed';
