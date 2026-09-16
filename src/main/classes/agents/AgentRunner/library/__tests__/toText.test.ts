import { describe, expect, it } from 'vitest';
import { toText } from '@/main/classes/agents/AgentRunner/library';

describe('toText', () => {
  it('reads what the agent said', () => {
    const line = {
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'Four cases, 13 steps.' }] },
    };

    expect(toText(line)).toBe('Four cases, 13 steps.');
  });

  it('leaves the tool blocks out, because the QA reads prose', () => {
    const line = {
      type: 'assistant',
      message: {
        content: [{ type: 'tool_use' }, { type: 'text', text: 'Done.' }],
      },
    };

    expect(toText(line)).toBe('Done.');
  });

  it('says nothing for an event that is not the agent speaking', () => {
    expect(toText({ type: 'rate_limit_event' })).toBe('');
  });
});
