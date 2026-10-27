/**
 * One piece of a bug's report or a published plan: a heading, text, list, steps, facts or
 * a table.
 */
export type BugReportBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'steps'; items: { text: string; isBad: boolean }[] }
  | { kind: 'facts'; items: { label: string; value: string; url: string | null }[] }
  | { kind: 'requests'; items: { call: string; outcome: string; answer?: string }[] }
  | { kind: 'table'; head: string[]; rows: string[][] };
