import { describe, expect, it } from 'vitest';
import { describeBug } from '@/modules/Assistant/library';
import { CHECKOUT, LOGIN } from './fixtures';

describe('describeBug', () => {
  it('tells a bug in full: where it was caught, what was expected and what showed, and how to reproduce it', () => {
    const { text, isError } = describeBug({ workspace: CHECKOUT, bugId: 'bug-01' });

    expect(isError).toBe(false);
    expect(text.split('\n')).toEqual([
      'Bug BUG-01 of w1 "Checkout regression": "Nothing happens on submit", severity high.',
      'Caught in r-01 at 09:41, on TC-01 "Open the store and find a product" step 2, walked on Web · Chrome 1280 × 800 by Claude Code (Haiku).',
      'Expected: At least one result comes back',
      'Got: Nothing moved.',
      'The page did not do it.',
      'To reproduce:',
      '1. Open the target URL',
      '2. Search for a product ← it breaks here',
      'Seen in 1 run, with 2 screenshots in Bugs.',
    ]);
  });

  it('names the runs that caught a bug seen again, and counts its screens', () => {
    const [bug] = CHECKOUT.bugs;
    const { text } = describeBug({
      workspace: {
        ...CHECKOUT,
        bugs: [
          {
            ...bug!,
            seenRuns: 2,
            sightings: [
              {
                runId: 'r-02',
                runWhen: '10:05',
                caseId: 'TC-01',
                stepNumber: 2,
                at: 1_760_000_100_000,
                shot: { isBad: true, src: null, file: '/tmp/qazinho/r-02/step-2.jpg' },
              },
            ],
          },
        ],
      },
      bugId: 'BUG-01',
    });

    expect(text.split('\n').at(-1)).toBe(
      'Seen in 2 runs (r-01, r-02), with 3 screenshots in Bugs.',
    );
  });

  it('does NOT make up a bug: it names the bugs there are', () => {
    expect(describeBug({ workspace: CHECKOUT, bugId: 'BUG-07' })).toEqual({
      text: 'w1 has no bug "BUG-07". Its bugs are BUG-01.',
      isError: true,
    });
    expect(describeBug({ workspace: LOGIN, bugId: 'BUG-01' })).toEqual({
      text: 'w2 "Login" has no bugs.',
      isError: true,
    });
  });
});
