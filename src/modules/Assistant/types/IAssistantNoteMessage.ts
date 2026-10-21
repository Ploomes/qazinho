/** A quiet line in the assistant's chat, such as the QA stopping an answer. */
export interface IAssistantNoteMessage {
  kind: 'note';
  id: string;
  text: string;
}
