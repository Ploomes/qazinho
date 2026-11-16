import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import { describe, expect, it } from 'vitest';
import { buildAskArgs, withPermissions } from '@/main/classes/agents/AgentRunner/library';

const TOOL = 'mcp__qazinho__approve_permission';
const BARE =
  '{"mcpServers":{"qazinho":{"type":"http","url":"http://127.0.0.1:9/t/~permissions"}}}';
const CALL: IRunAgent = {
  workspaceId: 'w-1',
  meter: { kind: 'chat', workspaceId: null, projectId: null },
  agentId: 'claude-code',
  command: 'claude',
  model: '',
  sessionId: null,
  prompt: 'Walk the case.',
};

describe('withPermissions', () => {
  /** O MCP da empresa do QA é dele para responder, numa run tanto quanto no chat. */
  it("grants a call that names QAzinho's server through that same server", () => {
    const run = {
      ...CALL,
      mcpConfig: '{"mcpServers":{}}',
      allowedTools: ['mcp__qazinho'],
    };

    expect(
      withPermissions({ call: run, permissions: { tool: TOOL, mcpConfig: BARE } }),
    ).toEqual({
      ...run,
      permissionTool: TOOL,
    });
  });

  it('hands a call with no server of QAzinho the one for permissions, keeping its folders readable', () => {
    const review = { ...CALL, allowedTools: [], readDirs: ['/runs/w-1'] };
    const granted = withPermissions({
      call: review,
      permissions: { tool: TOOL, mcpConfig: BARE },
    });
    const args = buildAskArgs(granted);

    expect(granted).toMatchObject({ mcpConfig: BARE, permissionTool: TOOL });
    expect(args[args.indexOf('--tools') + 1]).toBe('Read,Grep,Glob');
    expect(args).toContain('/runs/w-1');
    expect(args).not.toContain('--strict-mcp-config');
  });

  it('keeps the tools a build was handed', () => {
    const build = {
      ...CALL,
      tools: ['Bash', 'Read'],
      allowedTools: ['Bash(./gradlew:*)'],
      readDirs: ['/b'],
    };

    expect(
      withPermissions({ call: build, permissions: { tool: TOOL, mcpConfig: BARE } })
        .tools,
    ).toEqual(['Bash', 'Read']);
  });

  it('does NOT touch a call that has its own, nor one before QAzinho serves anything', () => {
    const chat = { ...CALL, permissionTool: 'mcp__other__approve' };

    expect(
      withPermissions({ call: chat, permissions: { tool: TOOL, mcpConfig: BARE } }),
    ).toBe(chat);
    expect(
      withPermissions({ call: CALL, permissions: { tool: TOOL, mcpConfig: null } }),
    ).toBe(CALL);
  });
});
