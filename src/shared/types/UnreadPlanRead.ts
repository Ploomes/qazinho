/**
 * Um plano posto de lado, lido de novo depois que o QA o consertou: o YAML dele, onde
 * ainda quebra, ou sumido da pasta.
 */
export type UnreadPlanRead =
  | { status: 'read'; yaml: string }
  | { status: 'unreadable'; line: number | null }
  | { status: 'gone' };
