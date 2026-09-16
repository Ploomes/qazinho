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
});
