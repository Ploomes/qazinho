/** O que o assistente respondeu, em Markdown. */
export interface IAssistantAgentMessage {
  kind: 'agent';
  id: string;
  text: string;
}
