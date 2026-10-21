/** What the QA wrote to the assistant. */
export interface IAssistantUserMessage {
  kind: 'user';
  id: string;
  text: string;
}
