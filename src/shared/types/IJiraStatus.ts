/** Um status do site do Jira do QA, com a categoria em que o Jira o põe. */
export interface IJiraStatus {
  name: string;
  category: 'new' | 'indeterminate' | 'done' | '';
}
