import type { IBugFiling } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { filingAfter } from '@/modules/Bug/library';

const FILING: IBugFiling = {
  filingId: 'f-1',
  bugId: 'BUG-02',
  target: { tracker: 'jira', project: 'SHOP' },
  story: 'SHOP-12',
  shots: 2,
  steps: [
    { row: 'ready', state: 'working' },
    { row: 'issue', state: 'pending' },
    { row: 'screens', state: 'pending' },
  ],
  result: null,
};

const states = (filing: IBugFiling) => filing.steps.map(({ state }) => state);

describe('filingAfter', () => {
  it('marks the evidence ready, then each step as main tells it', () => {
    const ready = filingAfter({ filing: FILING, change: { kind: 'ready' } });
    const issued = filingAfter({
      filing: ready,
      change: { kind: 'step', event: { filingId: 'f-1', step: 'issue', state: 'done' } },
    });

    expect(states(ready)).toEqual(['done', 'pending', 'pending']);
    expect(states(issued)).toEqual(['done', 'done', 'pending']);
  });

  it('does NOT move on a step of another bug’s sending', () => {
    expect(
      filingAfter({
        filing: FILING,
        change: {
          kind: 'step',
          event: { filingId: 'f-9', step: 'issue', state: 'done' },
        },
      }),
    ).toBe(FILING);
  });

  it('marks the step still going failed when it ended badly, and keeps how', () => {
    const result = {
      isFiled: false as const,
      failure: 'rejected' as const,
      said: 'Nope.',
    };
    const working = filingAfter({
      filing: FILING,
      change: {
        kind: 'step',
        event: { filingId: 'f-1', step: 'issue', state: 'working' },
      },
    });
    const ended = filingAfter({ filing: working, change: { kind: 'ended', result } });

    expect(states(ended)).toEqual(['working', 'failed', 'pending']);
    expect(ended.result).toEqual(result);
  });

  it('marks the first step not taken failed when nothing was under way', () => {
    const ready = filingAfter({ filing: FILING, change: { kind: 'ready' } });
    const ended = filingAfter({
      filing: ready,
      change: {
        kind: 'ended',
        result: { isFiled: false, failure: 'not-connected', said: '' },
      },
    });

    expect(states(ended)).toEqual(['done', 'failed', 'pending']);
  });
});
