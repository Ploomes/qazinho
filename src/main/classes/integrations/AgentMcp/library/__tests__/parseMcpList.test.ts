import { describe, expect, it } from 'vitest';
import { parseMcpList } from '@/main/classes/integrations/AgentMcp/library';

/**
 * O que `claude mcp list` imprimiu numa máquina real, linha de checagem de saúde
 * incluída.
 */
const PRINTED = `Checking MCP server health…

claude.ai Claude Docs: https://api.anthropic.com/v1/pages/mcp - ✓ Connected
claude.ai Gmail: https://gmailmcp.googleapis.com/mcp/v1 - ! Needs authentication
figma: https://mcp.figma.com/mcp (HTTP) - ! Needs authentication
design: https://mcp.figma.com/mcp (HTTP) - ✓ Connected
local: npx -y some-server - ✗ Failed to connect
`;

describe('parseMcpList', () => {
  it('reads each server as name, address and health, past the header', () => {
    expect(parseMcpList(PRINTED)).toEqual([
      {
        name: 'claude.ai Claude Docs',
        target: 'https://api.anthropic.com/v1/pages/mcp',
        state: 'connected',
      },
      {
        name: 'claude.ai Gmail',
        target: 'https://gmailmcp.googleapis.com/mcp/v1',
        state: 'needs-auth',
      },
      { name: 'figma', target: 'https://mcp.figma.com/mcp', state: 'needs-auth' },
      { name: 'design', target: 'https://mcp.figma.com/mcp', state: 'connected' },
      { name: 'local', target: 'npx -y some-server', state: 'failed' },
    ]);
  });

  it('reads nothing out of a machine with no server', () => {
    expect(
      parseMcpList('No MCP servers configured. Use `claude mcp add` to add a server.\n'),
    ).toEqual([]);
  });
});
