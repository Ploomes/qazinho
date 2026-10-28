/**
 * Um nó de um documento do Jira (Atlassian Document Format), solto o bastante para ler o
 * que o Jira manda e escrever um bug.
 */
export interface IAdfNode {
  type?: string;
  version?: number;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  content?: IAdfNode[];
}
