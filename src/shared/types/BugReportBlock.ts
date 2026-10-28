/**
 * Um pedaço do relatório de um bug ou de um plano publicado: um título, texto, lista,
 * passos, fatos ou uma tabela.
 */
export type BugReportBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'steps'; items: { text: string; isBad: boolean }[] }
  | { kind: 'facts'; items: { label: string; value: string; url: string | null }[] }
  | { kind: 'requests'; items: { call: string; outcome: string; answer?: string }[] }
  | { kind: 'table'; head: string[]; rows: string[][] };
