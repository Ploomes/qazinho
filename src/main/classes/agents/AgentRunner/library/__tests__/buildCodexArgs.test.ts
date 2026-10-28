import { describe, expect, it } from 'vitest';
import { buildCodexArgs } from '@/main/classes/agents/AgentRunner/library';

const BASE = { model: '', sessionId: null, schemaFile: null, ownServers: [] };

describe('buildCodexArgs', () => {
  it('runs one read-only turn as JSON lines, reading the prompt from stdin, never stopping for approval', () => {
    const args = buildCodexArgs(BASE);

    expect(args.slice(0, 3)).toEqual(['exec', '--json', '--skip-git-repo-check']);
    expect(args).toContain('approval_policy="never"');
    expect(args).toContain('sandbox_mode="read-only"');
    expect(args.at(-1)).toBe('-');
  });

  it('resumes the session the workspace already has', () => {
    expect(buildCodexArgs({ ...BASE, sessionId: 'thread-1' }).slice(0, 3)).toEqual([
      'exec',
      'resume',
      'thread-1',
    ]);
  });

  it('passes the model only when the QA picked one, and the answer schema as a file', () => {
    expect(buildCodexArgs(BASE)).not.toContain('-m');

    const args = buildCodexArgs({ ...BASE, model: 'gpt-5', schemaFile: '/tmp/s.json' });

    expect(args[args.indexOf('-m') + 1]).toBe('gpt-5');
    expect(args[args.indexOf('--output-schema') + 1]).toBe('/tmp/s.json');
  });

  /**
   * O texto do harness tem aspas e quebras de linha; como string TOML ele precisa chegar
   * inteiro.
   */
  it('hands the harness over as developer instructions, quoted for TOML', () => {
    const args = buildCodexArgs({ ...BASE, systemPrompt: 'Say "hi".\nThen stop.' });

    expect(args).toContain('developer_instructions="Say \\"hi\\".\\nThen stop."');
  });

  it("points Codex at QAzinho's MCP server when a run hands it the device", () => {
    const mcpConfig = JSON.stringify({
      mcpServers: { qazinho: { type: 'http', url: 'http://127.0.0.1:5000/t/w1' } },
    });

    expect(buildCodexArgs({ ...BASE, mcpConfig })).toContain(
      'mcp_servers.qazinho.url="http://127.0.0.1:5000/t/w1"',
    );
    expect(buildCodexArgs({ ...BASE, mcpConfig }).join(' ')).not.toContain(
      'tool_timeout_sec',
    );
  });

  it('lets a build write in its own folder, with the network on to fetch what it needs', () => {
    const args = buildCodexArgs({ ...BASE, writeDir: '/builds/b1/src' });

    expect(args).toContain('sandbox_mode="workspace-write"');
    expect(args).toContain('sandbox_workspace_write.network_access=true');
    expect(args[args.indexOf('-C') + 1]).toBe('/builds/b1/src');
    expect(args).not.toContain('sandbox_mode="read-only"');
  });

  /**
   * O Codex dá a uma ferramenta sessenta segundos a menos que se diga o contrário; as
   * esperas do assistente pelo QA são mais longas.
   */
  it('lets a tool call take as long as the MCP config says, in whole seconds', () => {
    const mcpConfig = JSON.stringify({
      mcpServers: {
        qazinho: { type: 'http', url: 'http://127.0.0.1:5000/t/~a', timeout: 360_500 },
      },
    });

    expect(buildCodexArgs({ ...BASE, mcpConfig })).toContain(
      'mcp_servers.qazinho.tool_timeout_sec=361',
    );
  });

  /**
   * O Codex lê os servidores MCP do config.toml do próprio QA: um da Atlassian daria ao
   * chat um caminho para o Confluence que o QAzinho nunca concedeu.
   */
  it("turns off the QA's own MCP servers, but the ones QAzinho hands the call", () => {
    const args = buildCodexArgs({
      ...BASE,
      ownServers: ['atlassian', 'figma', 'qazinho'],
      mcpConfig: JSON.stringify({
        mcpServers: {
          qazinho: { type: 'http', url: 'http://127.0.0.1:4000/mcp/w-1' },
          figma: { type: 'http', url: 'https://mcp.figma.com/mcp' },
        },
      }),
    });

    expect(args).toContain('mcp_servers.atlassian.enabled=false');
    expect(args.join(' ')).not.toContain('figma.enabled=false');
    expect(args.join(' ')).not.toContain('qazinho.enabled=false');
  });

  it('turns every one of them off for a call that is only talk', () => {
    const args = buildCodexArgs({ ...BASE, ownServers: ['atlassian', 'figma'] });

    expect(args.filter((arg) => arg.endsWith('.enabled=false'))).toEqual([
      'mcp_servers.atlassian.enabled=false',
      'mcp_servers.figma.enabled=false',
    ]);
  });

  it("leaves the QA's own servers on for the chat, whose call lets them in", () => {
    const args = buildCodexArgs({
      ...BASE,
      ownServers: ['atlassian'],
      permissionTool: 'mcp__qazinho__approve_permission',
    });

    expect(args.join(' ')).not.toContain('enabled=false');
  });
});
