/** Where a project's sync with its org stands: off, sent, sending, waiting for the network, a plan in conflict, the org blocked, read-only for this person, signed out, or refused. */
export type ProSyncState =
  | 'off'
  | 'synced'
  | 'sending'
  | 'waiting'
  | 'conflict'
  | 'blocked'
  | 'read-only'
  | 'signed-out'
  | 'failed';
