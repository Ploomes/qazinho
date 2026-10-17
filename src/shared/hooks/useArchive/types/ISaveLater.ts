export interface ISaveLater {
  save: (key: string, write: () => void) => void;
  flush: () => void;
}
