import type { ITestCase } from '@/modules/Plan/types';
import { describe, expect, it } from 'vitest';
import { keepVerdicts } from '@/modules/Plan/library';

const COUPON: ITestCase = {
  id: 'TC-01',
  title: 'An expired coupon is refused',
  priority: 'P1',
  goal: 'No discount from an expired coupon.',
  preconditions: 'One product in the cart.',
  steps: [{ action: 'Apply EXPIRED10', expected: 'The coupon is refused' }],
  lastVerdict: 'failed',
};

const SIGN_IN: ITestCase = {
  ...COUPON,
  id: 'TC-02',
  title: 'A member signs in',
  steps: [{ action: 'Sign in', expected: 'The home page greets them' }],
  lastVerdict: 'passed',
};

/**
 * A change to the plan through the chat writes the whole plan anew, every verdict at null, so
 * the cases the change never touched lost what the last run said about them.
 */
describe('keepVerdicts', () => {
  it('keeps the verdict of a case the new plan kept word for word, whatever its new id', () => {
    const after = [
      { ...SIGN_IN, id: 'TC-01', lastVerdict: null },
      { ...COUPON, id: 'TC-02', lastVerdict: null },
    ];

    expect(
      keepVerdicts({ before: [COUPON, SIGN_IN], after }).map(
        ({ lastVerdict }) => lastVerdict,
      ),
    ).toEqual(['passed', 'failed']);
  });

  it('does NOT keep it for a case whose steps changed: that one has not run yet', () => {
    const changed = {
      ...COUPON,
      steps: [{ action: 'Apply EXPIRED10 twice', expected: 'The coupon is refused' }],
      lastVerdict: null,
    };

    expect(
      keepVerdicts({ before: [COUPON], after: [changed] })[0]?.lastVerdict,
    ).toBeNull();
  });

  it('leaves a new case with no verdict', () => {
    const fresh = {
      ...COUPON,
      title: 'The newsletter refuses an email with no @',
      lastVerdict: null,
    };

    expect(keepVerdicts({ before: [COUPON], after: [fresh] })[0]?.lastVerdict).toBeNull();
  });
});
