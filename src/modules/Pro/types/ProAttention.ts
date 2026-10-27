/**
 * What the QA should know about their linked projects: no answer, no org, read-only,
 * blocked, refused, deleted in the org, or an org out of reach.
 */
export type ProAttention =
  | 'unreachable'
  | 'no-org'
  | 'reader'
  | 'blocked'
  | 'read-only'
  | 'signed-out'
  | 'gone'
  | 'no-access'
  | 'failed';
