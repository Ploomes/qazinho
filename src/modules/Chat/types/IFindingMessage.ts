/**
 * Um bug que o agente da run registrou ao lado de um passo, como a seção da run no chat o
 * mostra; `isSeenAgain` quando era um bug já aberto.
 */
export interface IFindingMessage {
  id: string;
  kind: 'finding';
  at: string;
  runId: string;
  bugId: string;
  title: string;
  isSeenAgain?: boolean;
}
