import { describe, expect, it } from 'vitest';
import { readChatAnswer } from '@/harness/library';

const CASE = {
  title: 'Checkout with a test card',
  priority: 'P1',
  goal: 'A card order goes through.',
  preconditions: 'One product in the cart.',
  steps: [{ action: 'Pay', expected: 'A confirmation appears' }],
};

describe('readChatAnswer', () => {
  it('reads a reply with no plan', () => {
    expect(readChatAnswer(JSON.stringify({ reply: '  1 + 1 is 2. ' }))).toEqual({
      reply: '1 + 1 is 2.',
      plan: null,
    });
  });

  it('reads a reply with the plan the QA asked for', () => {
    const answer = readChatAnswer(
      JSON.stringify({
        reply: 'One case.',
        plan: { summary: 'One case.', cases: [CASE] },
      }),
    );

    expect(answer?.plan?.cases).toEqual([CASE]);
  });

  it('keeps the reply when the plan breaks the schema, and drops only the plan', () => {
    const answer = readChatAnswer(
      JSON.stringify({
        reply: 'Here it is.',
        plan: { summary: 'x', cases: [{ ...CASE, priority: 'urgent' }] },
      }),
    );

    expect(answer).toEqual({ reply: 'Here it is.', plan: null });
  });

  it('takes prose the agent printed instead of JSON as the reply', () => {
    expect(readChatAnswer('I could not reach the page.')).toEqual({
      reply: 'I could not reach the page.',
      plan: null,
    });
  });

  it('gives nothing for JSON that is not a chat answer, or for nothing at all', () => {
    expect(readChatAnswer(JSON.stringify({ verdict: 'passed' }))).toBeNull();
    expect(readChatAnswer('   ')).toBeNull();
  });
});
