import { describe, expect, it } from 'vitest';
import { parseChatAnswer } from '@/modules/Chat/library';

const PLAN = {
  summary: 'One case.',
  cases: [
    {
      title: 'Sign in',
      priority: 'P1',
      goal: 'The QA gets in.',
      preconditions: 'An account.',
      steps: [{ action: 'Sign in', expected: 'The home page' }],
    },
  ],
};

describe('parseChatAnswer', () => {
  it('reads a plain reply as talk, with no plan', () => {
    expect(parseChatAnswer(JSON.stringify({ reply: '1 + 1 is 2.' }))).toEqual({
      reply: '1 + 1 is 2.',
      plan: null,
    });
  });

  it('reads the plan that comes with a reply when the QA asked for one', () => {
    const read = parseChatAnswer(
      JSON.stringify({ reply: 'Drafted one case.', plan: PLAN }),
    );

    expect(read?.reply).toBe('Drafted one case.');
    expect(read?.plan?.[0]?.title).toBe('Sign in');
  });

  it('does NOT take a plan that has no case in it', () => {
    expect(
      parseChatAnswer(
        JSON.stringify({ reply: 'Here.', plan: { summary: '', cases: [] } }),
      ),
    ).toEqual({ reply: 'Here.', plan: null });
  });

  it('gives up on an answer that is neither a reply nor a plan', () => {
    expect(parseChatAnswer('not json')).toBeNull();
    expect(parseChatAnswer(JSON.stringify({ reply: '  ' }))).toBeNull();
  });
});
