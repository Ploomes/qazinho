import { describe, expect, it } from 'vitest';
import { describeCase } from '@/harness/context/library';

const STEP = {
  caseId: 'TC-01',
  caseTitle: 'Sign in',
  numberInCase: 1,
  action: 'Open the sign in page',
  expected: 'The form shows',
};

describe('describeCase', () => {
  it('names the case and lists every step with what the QA expects', () => {
    expect(
      describeCase({
        steps: [
          STEP,
          {
            ...STEP,
            numberInCase: 2,
            action: 'Sign in',
            expected: 'The home page opens',
          },
        ],
        screen: '',
      }),
    ).toBe(
      [
        'TC-01 · Sign in',
        'Carry out these steps in order, and report each one as soon as you judged it:',
        '1. Open the sign in page',
        '   The QA expects: The form shows',
        '2. Sign in',
        '   The QA expects: The home page opens',
      ].join('\n'),
    );
  });

  it('hands over the screen the case starts on, so the agent acts without looking first', () => {
    expect(
      describeCase({ steps: [STEP], screen: 'Sign in · [button] Continue' }),
    ).toContain('The device shows right now:\nSign in · [button] Continue');
  });

  it('tells the agent to stop at once when there is nothing to walk', () => {
    expect(describeCase({ steps: [], screen: 'Home' })).toBe(
      'This case has no steps. End your turn.',
    );
  });
});
