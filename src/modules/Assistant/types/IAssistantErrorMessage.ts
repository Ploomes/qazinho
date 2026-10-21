/** Why the assistant could not answer, in the QA's language. */
export interface IAssistantErrorMessage {
  kind: 'error';
  id: string;
  text: string;
}
