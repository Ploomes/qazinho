/** O que o QA escreveu ao assistente. */
export interface IAssistantUserMessage {
  kind: 'user';
  id: string;
  text: string;
}
