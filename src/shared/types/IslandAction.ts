/**
 * Um pedido do QA na ilha: parar a run de um workspace, abri-lo no app, ou responder com
 * palavras a pergunta que a run dele fez.
 */
export type IslandAction =
  | { kind: 'stop' | 'open'; workspaceId: string }
  | { kind: 'answer'; workspaceId: string; questionId: string; text: string };
