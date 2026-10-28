/**
 * O que uma ferramenta fez, em palavras para o agente, se falhou, e o build que iniciou
 * quando iniciou um.
 */
export interface IToolDone {
  text: string;
  isError: boolean;
  buildId?: string;
}
