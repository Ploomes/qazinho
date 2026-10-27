/**
 * Writes a key's last change once its burst settles; `drop` forgets a write still
 * waiting, for what is gone.
 */
export interface ISaveLater {
  save: (key: string, write: () => void) => void;
  drop: (key: string) => void;
  flush: () => void;
}
