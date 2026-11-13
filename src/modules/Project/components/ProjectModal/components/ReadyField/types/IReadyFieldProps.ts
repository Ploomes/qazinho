/** Os status do Jira em que uma história do projeto chegou para teste. */
export interface IReadyFieldProps {
  statuses: string[];
  onChange: (statuses: string[]) => void;
}
