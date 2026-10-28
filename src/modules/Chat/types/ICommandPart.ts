/**
 * Uma coisa que um comando nomeia, como o chip dele a mostra: um repositório, uma branch,
 * a chave de uma história ou o título dela; a que mais importa se destaca.
 */
export interface ICommandPart {
  key: string;
  text: string;
  isStrong: boolean;
}
