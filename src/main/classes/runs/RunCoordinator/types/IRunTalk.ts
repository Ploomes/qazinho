/** O que o QA disse no meio de uma run: o que espera o agente, e se ele já ouviu. */
export interface IRunTalk {
  waiting: string[];
  isOpen: boolean;
  refused: number;
}
