import { describe, expect, it } from 'vitest';
import { buildCodexArgs } from '@/main/classes/agents/AgentRunner/library';

const BASE = { model: '', sessionId: null, schemaFile: null };

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

  /** The harness text has quotes and line breaks; as a TOML string it must arrive whole. */
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
  });
});
