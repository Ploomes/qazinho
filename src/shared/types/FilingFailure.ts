/** Why a bug did not become an issue: the tracker not connected, the access refused, the project or repository not there, out of reach, what was sent refused, or something else. */
export type FilingFailure =
  | 'not-connected'
  | 'unauthorized'
  | 'not-found'
  | 'unreachable'
  | 'rejected'
  | 'unexpected';
