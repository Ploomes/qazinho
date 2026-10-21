/** Where copying a branch's code stands: finding its commits, downloading it, or reading what it changed. */
export type CodeStep = 'commit' | 'download' | 'diff';
