/**
 * Uma coisa que o QAzinho faz para conectar um servidor MCP ao agente do QA, na ordem em
 * que o popup de login as lista.
 */
export type McpSignInStep =
  'check' | 'add' | 'open' | 'authorize' | 'browser' | 'terminal';
