/** Why a bug did not become an issue. */
export type FilingFailure =
  | 'not-connected'
  | 'unauthorized'
  | 'not-found'
  | 'unreachable'
  | 'rejected'
  | 'unexpected';
