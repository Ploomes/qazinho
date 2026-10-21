/** What the assistant answered, in Markdown. */
export interface IAssistantAgentMessage {
  kind: 'agent';
  id: string;
  text: string;
}
