/** A node of a Jira document (Atlassian Document Format), read loosely: what QAzinho turns into text. */
export interface IAdfNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  content?: IAdfNode[];
}
