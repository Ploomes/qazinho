import type { IListedMcpServer } from '@/main/classes/integrations/AgentMcp/types';

type CodexServer = {
  name?: unknown;
  enabled?: unknown;
  transport?: { url?: unknown; command?: unknown };
  auth_status?: unknown;
};

/**
 * Lê `codex mcp list --json`: um servidor com login, ou um sem login a fazer, está
 * conectado.
 */
export function parseCodexMcpList(printed: string): IListedMcpServer[] {
  let servers: CodexServer[];

  try {
    servers = JSON.parse(printed) as CodexServer[];
  } catch {
    return [];
  }

  if (!Array.isArray(servers)) return [];

  return servers.map((server) => ({
    name: typeof server.name === 'string' ? server.name : '',
    target:
      typeof server.transport?.url === 'string'
        ? server.transport.url
        : typeof server.transport?.command === 'string'
          ? server.transport.command
          : '',
    state:
      server.enabled === false
        ? 'failed'
        : server.auth_status === 'not_logged_in'
          ? 'needs-auth'
          : 'connected',
  }));
}
