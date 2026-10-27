/** Where a project's sync with its org stands. */
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
