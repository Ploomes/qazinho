/** The bytes a request asked for: the whole file, a slice of it, or a slice that is not in it. */
export type ByteRange =
  { kind: 'whole' } | { kind: 'slice'; start: number; end: number } | { kind: 'outside' };
