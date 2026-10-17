export interface ILastWritten {
  isNew: (key: string, text: string) => boolean;
  keep: (key: string, text: string) => void;
  forget: (key: string) => void;
}
