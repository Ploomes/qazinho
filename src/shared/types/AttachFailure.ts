/** Por que um arquivo não foi anexado ao chat. */
export type AttachFailure =
  | { reason: 'too-many' }
  | { reason: 'too-big'; name: string }
  | { reason: 'unreadable'; name: string }
  | { reason: 'no-bridge' };
