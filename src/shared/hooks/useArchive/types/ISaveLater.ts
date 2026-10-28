/**
 * Escreve a última mudança de uma chave assim que a rajada dela acalma; `drop` esquece
 * uma escrita ainda esperando, para o que se foi.
 */
export interface ISaveLater {
  save: (key: string, write: () => void) => void;
  drop: (key: string) => void;
  flush: () => void;
}
