import { describe, expect, it } from 'vitest';
import { describeCase } from '@/harness/context/library';

const STEP = {
  caseId: 'TC-01',
  caseTitle: 'Sign in',
  casePriority: 'P1',
  caseGoal: '',
  casePreconditions: '',
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
        language: 'en',
      }),
    ).toBe(
      [
        'TC-01 · Sign in',
        'Carry out these steps in order, and report each one as soon as you judged it:',
        '1. Open the sign in page',
        '   The QA expects: The form shows',
        '2. Sign in',
        '   The QA expects: The home page opens',
        'Write what you report and note in English, whatever language these steps are in.',
      ].join('\n'),
    );
  });

  it('says what the case is for and what it needs before step 1, so the agent sets it up', () => {
    expect(
      describeCase({
        steps: [
          {
            ...STEP,
            caseGoal: 'A member gets in.',
            casePreconditions: 'Account qa@shop.test, password Test-1234.',
          },
        ],
        screen: '',
        language: 'en',
      }),
    ).toBe(
      [
        'TC-01 · Sign in',
        'Goal: A member gets in.',
        'Preconditions: Account qa@shop.test, password Test-1234.',
        'Carry out these steps in order, and report each one as soon as you judged it:',
        '1. Open the sign in page',
        '   The QA expects: The form shows',
        'Write what you report and note in English, whatever language these steps are in.',
      ].join('\n'),
    );
  });

  /**
   * A Portuguese case came back with an English note while the rule sat only in the system prompt,
   * and a Portuguese case full of an English site's labels came back in English while this line
   * asked for the language of the steps: it now names the language the QA reads.
   */
  it('asks for the report in the language the QA reads, next to the steps', () => {
    expect(describeCase({ steps: [STEP], screen: '', language: 'pt' })).toContain(
      'Write what you report and note in Brazilian Portuguese, whatever language these steps are in.',
    );
  });

  it('hands over the screen the case starts on, so the agent acts without looking first', () => {
    expect(
      describeCase({
        steps: [STEP],
        screen: 'Sign in · [button] Continue',
        language: 'en',
      }),
    ).toContain('The device shows right now:\nSign in · [button] Continue');
  });

  it('tells the agent to stop at once when there is nothing to walk', () => {
    expect(describeCase({ steps: [], screen: 'Home', language: 'en' })).toBe(
      'This case has no steps. End your turn.',
    );
  });
});
