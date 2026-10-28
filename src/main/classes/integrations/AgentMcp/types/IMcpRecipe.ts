import type { McpSignInRoute } from './McpSignInRoute';

/**
 * Como uma CLI de agente guarda servidores MCP: os comandos para listar, adicionar,
 * entrar e remover, como a lista dela é lida, e a rota de login dela.
 */
export interface IMcpRecipe {
  list: string[];
  reads: 'claude' | 'codex';
  add: (server: { name: string; url: string }) => string[];
  login: (name: string) => string[];
  remove: (name: string) => string[];
  signIn: Exclude<McpSignInRoute, 'terminal'>;
}
