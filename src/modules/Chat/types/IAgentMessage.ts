export interface IAgentMessage {
  id: string;
  kind: 'agent';
  at: string;
  who: string;
  text: string;
}
