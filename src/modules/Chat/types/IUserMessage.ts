export interface IUserMessage {
  id: string;
  kind: 'user';
  at: string;
  text: string;
}
