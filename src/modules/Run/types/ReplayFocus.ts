/**
 * What the replay opens on: the whole run, the take of one case, or the moment of one
 * bug.
 */
export type ReplayFocus =
  { kind: 'run' } | { kind: 'case'; caseId: string } | { kind: 'bug'; bugId: string };
