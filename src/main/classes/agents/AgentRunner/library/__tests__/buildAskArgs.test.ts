import { describe, expect, it } from 'vitest';
import { buildAskArgs } from '@/main/classes/agents/AgentRunner/library';

describe('buildAskArgs', () => {
  it('asks once, in json, on the model the QA picked', () => {
    const args = buildAskArgs({ model: 'sonnet', sessionId: null });

    expect(args).toEqual([
      '--print',
      '--output-format',
      'stream-json',
      '--verbose',
      '--model',
      'sonnet',
    ]);
  });

  it('leaves the model to the agent when the QA kept its default', () => {
    const args = buildAskArgs({ model: '', sessionId: null });

    expect(args).not.toContain('--model');
  });

  it('carries on the session the workspace already has', () => {
    const args = buildAskArgs({ model: 'sonnet', sessionId: 'abc-123' });

    expect(args).toContain('--resume');
    expect(args[args.indexOf('--resume') + 1]).toBe('abc-123');
  });

  it('asks for a shape when the answer has to be a plan', () => {
    const args = buildAskArgs({
      model: 'sonnet',
      sessionId: null,
      schema: '{"type":"object"}',
    });

    expect(args).toContain('--json-schema');
    expect(args.at(-1)).toBe('{"type":"object"}');
  });

  it('hands the harness its instructions once, as the system prompt', () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      systemPrompt: 'You test web apps.',
    });

    expect(args.slice(-2)).toEqual(['--append-system-prompt', 'You test web apps.']);
  });

  it('gives the agent the device tools and takes every other tool away', () => {
    const args = buildAskArgs({
      model: '',
      sessionId: null,
      mcpConfig: '{"mcpServers":{}}',
    });

    expect(args.slice(-7)).toEqual([
      '--mcp-config',
      '{"mcpServers":{}}',
      '--strict-mcp-config',
      '--tools',
      '',
      '--allowedTools',
      'mcp__qazinho',
    ]);
  });

  it('does NOT restrict the agent tools when no device is attached', () => {
    expect(buildAskArgs({ model: '', sessionId: null })).not.toContain('--tools');
  });

  it('takes every tool away from a call that is only talk', () => {
    expect(
      buildAskArgs({ model: '', sessionId: null, hasNoTools: true }).slice(-2),
    ).toEqual(['--tools', '']);
  });
});
