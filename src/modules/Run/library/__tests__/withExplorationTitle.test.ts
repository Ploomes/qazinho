import type { IRun } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { withExplorationTitle } from '@/modules/Run/library';

const RUN: IRun = {
  id: 'r-01',
  meta: 'Shop',
  startedAt: '10:00',
  durationSec: 60,
  costUsd: null,
  counts: { passed: 2, failed: 0, blocked: 0, skipped: 0 },
  cases: [{ id: 'EX', title: '', verdict: 'passed', durationSec: 60, steps: [] }],
  endedBy: 'finished',
  video: null,
  kind: 'explore',
};

describe('withExplorationTitle', () => {
  it("names an exploration's screens the way the QA reads it", () => {
    expect(withExplorationTitle({ run: RUN, title: 'Exploração' }).cases[0]?.title).toBe(
      'Exploração',
    );
  });

  it('does NOT touch a run of the plan', () => {
    const walked: IRun = {
      ...RUN,
      kind: undefined,
      cases: [{ ...RUN.cases[0]!, id: 'TC-01', title: 'Sign in' }],
    };

    expect(withExplorationTitle({ run: walked, title: 'Exploração' })).toBe(walked);
  });
});
