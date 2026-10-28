/** Uma linha discreta no chat do assistente, como o QA parando uma resposta. */
export interface IAssistantNoteMessage {
  kind: 'note';
  id: string;
  text: string;
}
