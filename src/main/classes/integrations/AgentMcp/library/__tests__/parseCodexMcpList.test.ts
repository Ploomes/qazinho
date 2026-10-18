import { describe, expect, it } from 'vitest';
import { parseCodexMcpList } from '@/main/classes/integrations/AgentMcp/library';

/** The shape `codex mcp list --json` printed for a server added and not signed in yet. */
const server = (patch: object) =>
  JSON.stringify([
    {
      name: 'figma',
      enabled: true,
      transport: { type: 'streamable_http', url: 'https://mcp.figma.com/mcp' },
      auth_status: 'not_logged_in',
      ...patch,
    },
  ]);

describe('parseCodexMcpList', () => {
  it('reads a server waiting for a sign-in', () => {
    expect(parseCodexMcpList(server({}))).toEqual([
      { name: 'figma', target: 'https://mcp.figma.com/mcp', state: 'needs-auth' },
    ]);
  });

  it('reads a server signed in with OAuth or a token, or with nothing to sign in to, as connected', () => {
    for (const auth_status of ['o_auth', 'bearer_token', 'unsupported'])
      expect(parseCodexMcpList(server({ auth_status }))[0]?.state).toBe('connected');
  });

  it('reads a turned-off server as failed', () => {
    expect(parseCodexMcpList(server({ enabled: false }))[0]?.state).toBe('failed');
  });

  it('reads nothing out of what is not the JSON list', () => {
    expect(parseCodexMcpList('No MCP servers configured yet.')).toEqual([]);
    expect(parseCodexMcpList('{}')).toEqual([]);
  });
});
