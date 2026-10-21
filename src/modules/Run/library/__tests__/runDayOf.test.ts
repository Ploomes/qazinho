import type { IRunStep } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { runDayOf } from '@/modules/Run/library';

const step = (from: number | null): IRunStep => ({
  number: 1,
  action: 'Open the cart',
  verdict: 'passed',
  why: null,
  bugId: null,
  shot: null,
  shotFile: null,
  span: from === null ? null : { from, to: from + 2_000 },
});

describe('runDayOf', () => {
  it('reads the day of the first step the run walked, on the QA clock', () => {
    const late = new Date(2026, 9, 19, 23, 58).getTime();
    const early = new Date(2026, 9, 19, 23, 50).getTime();

    expect(
      runDayOf({
        cases: [
          {
            id: 'TC-02',
            title: '',
            verdict: 'passed',
            durationSec: 0,
            steps: [step(late)],
          },
          {
            id: 'TC-01',
            title: '',
            verdict: 'passed',
            durationSec: 0,
            steps: [step(early)],
          },
        ],
      }),
    ).toBe('2026-10-19');
  });

  it('pads the month and the day', () => {
    expect(
      runDayOf({
        cases: [
          {
            id: 'TC-01',
            title: '',
            verdict: 'passed',
            durationSec: 0,
            steps: [step(new Date(2026, 0, 5, 9, 0).getTime())],
          },
        ],
      }),
    ).toBe('2026-01-05');
  });

  it('gives null for a run whose steps kept no time, such as one saved before they did', () => {
    expect(
      runDayOf({
        cases: [
          {
            id: 'TC-01',
            title: '',
            verdict: 'skipped',
            durationSec: 0,
            steps: [step(null)],
          },
        ],
      }),
    ).toBeNull();
    expect(runDayOf({ cases: [] })).toBeNull();
  });
});
