/** A path git says changed in a copy: where it is, and whether it was changed, added, deleted, renamed or is new to git. */
export interface IChangedPath {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
}
