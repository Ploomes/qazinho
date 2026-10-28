/**
 * A próxima coisa a fazer nas telas MCP do agente: apertar teclas, esperar, ou o que a
 * tela diz que aconteceu.
 */
export type McpMove =
  | { kind: 'press'; keys: string; step: 'open' | 'authorize' }
  | { kind: 'wait' }
  | { kind: 'authorizing' }
  | { kind: 'connected' }
  | { kind: 'refused'; said: string };
