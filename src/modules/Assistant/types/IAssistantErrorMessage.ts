/** Por que o assistente não conseguiu responder, no idioma do QA. */
export interface IAssistantErrorMessage {
  kind: 'error';
  id: string;
  text: string;
}
