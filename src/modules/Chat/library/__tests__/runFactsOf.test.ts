import type { IRun, IRunStep } from '@/modules/Run';
import { describe, expect, it } from 'vitest';
import { runFactsOf } from '@/modules/Chat/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const RUN = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
  isFinished: true,
}).runs[0]!;

const STEP: IRunStep = {
  number: 1,
  action: '',
  verdict: 'passed',
  why: null,
  bugId: null,
  shot: null,
  shotFile: null,
  span: null,
};

/** The fixture's first step began at 1_760_000_000_000, read on the clock the tests run under. */
const DAY = new Date(1_760_000_000_000).toLocaleDateString('sv-SE');

describe('runFactsOf', () => {
  it('reads a run step by step, with how it ended', () => {
    const facts = runFactsOf({ run: RUN, isBrief: false });

    expect(facts[0]).toBe(`started ${DAY} at 09:41, took 0s, walked the whole plan`);
    expect(facts[1]).toBe('cases: 1 passed, 1 failed, 0 blocked, 0 skipped');
    expect(facts[2]).toBe('steps: 4 passed, 1 failed, 0 blocked, 1 skipped');
    expect(facts).toContain('  step 1 passed: Open the target URL');
    expect(facts).toContain(
      '  step 2 failed: Leave the house number empty (The page did not do it.)',
    );
  });

  it('tells the agent which steps were walked again without it, and which it healed', () => {
    const cases = RUN.cases.map((runCase, position) => ({
      ...runCase,
      steps: runCase.steps.map((step) => ({
        ...step,
        by: position === 0 ? ('replay' as const) : ('healed' as const),
      })),
    }));
    const facts = runFactsOf({ run: { ...RUN, cases }, isBrief: false });

    expect(facts).toContain('  step 1 passed without the agent: Open the target URL');
    expect(facts).toContain(
      '  step 1 passed by the agent, after the recorded walk stopped holding: Add the product to the cart',
    );
  });

  it('says what the run cost when its agent said', () => {
    expect(runFactsOf({ run: { ...RUN, costUsd: 0.0412 }, isBrief: false })[0]).toBe(
      `started ${DAY} at 09:41, took 0s, cost $0.041, walked the whole plan`,
    );
  });

  it('gives only the time of a run whose steps kept no time', () => {
    const untimed = {
      ...RUN,
      cases: RUN.cases.map((runCase) => ({
        ...runCase,
        steps: runCase.steps.map((step) => ({ ...step, span: null })),
      })),
    };

    expect(runFactsOf({ run: untimed, isBrief: false })[0]).toBe(
      'started 09:41, took 0s, walked the whole plan',
    );
  });

  it('keeps only what failed or was blocked when brief, and leaves a case that held out', () => {
    const facts = runFactsOf({ run: RUN, isBrief: true });

    expect(facts.slice(3)).toEqual([
      'TC-02 Checkout with a test card: failed',
      '  step 2 failed: Leave the house number empty (The page did not do it.)',
    ]);
  });
  describe('an exploration', () => {
    const EXPLORED: IRun = {
      ...RUN,
      kind: 'explore',
      cases: [
        {
          id: 'EX',
          title: '',
          verdict: 'passed',
          durationSec: 40,
          steps: [
            { ...STEP, number: 1, action: 'Shop', why: 'The home.' },
            { ...STEP, number: 2, action: 'Cart', why: 'The total.' },
          ],
        },
      ],
      suggestion: {
        summary: 'The cart total is wrong.',
        cases: [
          {
            title: 'Cart total adds the items',
            priority: 'P1',
            goal: 'The total is right.',
            preconditions: 'One shirt in the cart.',
            steps: [{ action: 'Open the cart', expected: 'Total R$ 79,90' }],
          },
        ],
      },
    };

    it('tells the screens it reached and the cases it suggested, for a plan to grow from', () => {
      const facts = runFactsOf({ run: EXPLORED, isBrief: false });

      expect(facts[0]).toMatch(/^an exploration of the app with no plan, started /);
      expect(facts).toEqual(
        expect.arrayContaining([
          '  screen 1: Shop (The home.)',
          '  screen 2: Cart (The total.)',
          'what the explorer said: The cart total is wrong.',
          'suggested P1 case: Cart total adds the items (The total is right.)',
          '  before: One shirt in the cart.',
          '  step 1: Open the cart → Total R$ 79,90',
        ]),
      );
    });

    it('keeps an older exploration to its screens', () => {
      const facts = runFactsOf({ run: EXPLORED, isBrief: true });

      expect(facts).toContain('screens: Shop, Cart');
      expect(facts.join('\n')).not.toContain('suggested');
    });
  });
});
