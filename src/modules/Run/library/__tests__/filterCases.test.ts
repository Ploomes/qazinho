import type { IRunCase } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { filterCases } from '@/modules/Run/library';

const CASES: IRunCase[] = [
  {
    id: 'TC-01',
    title: 'Open the store',
    verdict: 'passed',
    durationSec: 6,
    steps: [
      {
        number: 1,
        action: 'Open the URL',
        verdict: 'passed',
        why: null,
        bugId: null,
        shot: null,
      },
      {
        number: 2,
        action: 'Search',
        verdict: 'passed',
        why: null,
        bugId: null,
        shot: null,
      },
    ],
  },
  {
    id: 'TC-02',
    title: 'Checkout',
    verdict: 'failed',
    durationSec: 6,
    steps: [
      {
        number: 1,
        action: 'Add to cart',
        verdict: 'passed',
        why: null,
        bugId: null,
        shot: null,
      },
      {
        number: 2,
        action: 'Pay',
        verdict: 'failed',
        why: null,
        bugId: 'BUG-01',
        shot: null,
      },
    ],
  },
];

describe('filterCases', () => {
  it('keeps everything when nothing is filtered', () => {
    expect(filterCases({ cases: CASES, filter: 'all' })).toEqual(CASES);
  });

  it('drops the cases that have no step of that verdict', () => {
    const failed = filterCases({ cases: CASES, filter: 'failed' });

    expect(failed).toHaveLength(1);
    expect(failed[0]?.id).toBe('TC-02');
  });

  it('keeps only the steps that match, so the list reads as the filter says', () => {
    const failed = filterCases({ cases: CASES, filter: 'failed' });

    expect(failed[0]?.steps).toHaveLength(1);
    expect(failed[0]?.steps[0]?.action).toBe('Pay');
  });

  it('shows nothing when no step was blocked', () => {
    expect(filterCases({ cases: CASES, filter: 'blocked' })).toEqual([]);
  });
});
