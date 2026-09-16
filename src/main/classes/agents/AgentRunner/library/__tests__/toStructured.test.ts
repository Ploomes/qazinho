import { describe, expect, it } from 'vitest';
import { toStructured } from '@/main/classes/agents/AgentRunner/library';

const ANSWERED = {
  type: 'assistant',
  message: {
    content: [
      {
        type: 'tool_use',
        name: 'StructuredOutput',
        input: { verdict: 'failed', why: 'No inline error appeared.' },
      },
    ],
  },
};

describe('toStructured', () => {
  it('reads the answer to a schema out of the tool call it arrives in', () => {
    expect(JSON.parse(toStructured(ANSWERED))).toEqual({
      verdict: 'failed',
      why: 'No inline error appeared.',
    });
  });

  it('a turn that only spoke has no structured answer in it', () => {
    const spoke = {
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'Looks fine to me.' }] },
    };

    expect(toStructured(spoke)).toBe('');
  });

  it('another tool the agent used along the way is not the answer', () => {
    const used = {
      type: 'assistant',
      message: {
        content: [{ type: 'tool_use', name: 'Read', input: { file: 'a.ts' } }],
      },
    };

    expect(toStructured(used)).toBe('');
  });

  it('a line that is not a turn holds nothing', () => {
    expect(toStructured({ type: 'result', result: '{"verdict":"passed"}' })).toBe('');
  });
});
