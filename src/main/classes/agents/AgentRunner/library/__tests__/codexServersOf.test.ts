import { describe, expect, it } from 'vitest';
import { codexServersOf } from '@/main/classes/agents/AgentRunner/library';

describe('codexServersOf', () => {
  it('names each server the config declares, its own sub-tables counted once', () => {
    expect(
      codexServersOf(
        [
          'model = "gpt-5"',
          '[mcp_servers.atlassian]',
          'url = "https://mcp.atlassian.com/v1/sse"',
          '[mcp_servers.figma]',
          'url = "https://mcp.figma.com/mcp"',
          '[mcp_servers.figma.http_headers]',
          'X = "1"',
          '[mcp_servers.local-docs]',
          'command = "npx"',
        ].join('\n'),
      ),
    ).toEqual(['atlassian', 'figma', 'local-docs']);
  });

  it('names a server declared by dotted keys at the root', () => {
    expect(codexServersOf('mcp_servers.jira.url = "https://j.test/mcp"\n')).toEqual([
      'jira',
    ]);
  });

  /** A flag splits its key on every dot, so such a name cannot be turned off from the command line. */
  it('does NOT name one a flag cannot address', () => {
    expect(codexServersOf('[mcp_servers."my.server"]\nurl = "x"\n')).toEqual([]);
  });

  it('names none in a config with no server, or no config at all', () => {
    expect(codexServersOf('[profiles.fast]\nmodel = "o4-mini"\n')).toEqual([]);
    expect(codexServersOf('')).toEqual([]);
  });
});
