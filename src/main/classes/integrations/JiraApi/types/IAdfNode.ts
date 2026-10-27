/**
 * A node of a Jira document (Atlassian Document Format), loose enough to read what Jira
 * sends and to write a bug.
 */
export interface IAdfNode {
  type?: string;
  version?: number;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  content?: IAdfNode[];
}
