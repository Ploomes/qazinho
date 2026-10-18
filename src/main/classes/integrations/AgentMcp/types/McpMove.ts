/** The next thing to do on the agent's MCP screens: press keys, wait, or what the screen says happened. */
export type McpMove =
  | { kind: 'press'; keys: string; step: 'open' | 'authorize' }
  | { kind: 'wait' }
  | { kind: 'authorizing' }
  | { kind: 'connected' }
  | { kind: 'refused'; said: string };
