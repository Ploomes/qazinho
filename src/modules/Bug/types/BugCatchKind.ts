/**
 * How a failure or a finding landed: as a new bug, on a bug already open seen again, or
 * on one this run had already caught.
 */
export type BugCatchKind = 'new' | 'again' | 'repeat';
