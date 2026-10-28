/** Em que pé está a sincronização de um projeto com a org dele. */
export type ProSyncState =
  | 'off'
  | 'synced'
  | 'sending'
  | 'waiting'
  | 'conflict'
  | 'blocked'
  | 'read-only'
  | 'signed-out'
  | 'gone'
  | 'no-access'
  | 'failed';
