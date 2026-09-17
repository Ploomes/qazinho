/** Something the QA pointed at with @ in the chat, with the facts gocrash holds about it. */
export interface IChatReference {
  kind: 'run' | 'bug' | 'case';
  id: string;
  title: string;
  facts: string[];
}
