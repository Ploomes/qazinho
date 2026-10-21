import type { IReplayTimeline } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { momentAt } from '@/modules/Run/library';

const step = (props: { number: number; fromMs: number; toMs: number }) => ({
  ...props,
  action: `Step ${String(props.number)}`,
  verdict: 'passed' as const,
  bugId: null,
});

const TIMELINE: IReplayTimeline = {
  durationMs: 20_000,
  chapters: [
    {
      caseId: 'TC-01',
      title: 'Sign in',
      verdict: 'passed',
      fromMs: 1_000,
      toMs: 6_000,
      steps: [
        step({ number: 1, fromMs: 1_000, toMs: 3_000 }),
        step({ number: 2, fromMs: 3_000, toMs: 6_000 }),
      ],
    },
    {
      caseId: 'TC-02',
      title: 'Checkout',
      verdict: 'passed',
      fromMs: 8_000,
      toMs: 12_000,
      steps: [step({ number: 1, fromMs: 8_000, toMs: 12_000 })],
    },
  ],
  marks: [],
};

describe('momentAt', () => {
  it('finds the case and the step a moment shows', () => {
    expect(momentAt({ timeline: TIMELINE, ms: 4_000 })).toEqual({
      chapterIndex: 0,
      stepIndex: 1,
      isBetween: false,
    });
  });

  it('says a moment after a case ended, before the next began, is the app opening anew', () => {
    expect(momentAt({ timeline: TIMELINE, ms: 7_000 })).toEqual({
      chapterIndex: 0,
      stepIndex: 1,
      isBetween: true,
    });
  });

  it('finds nothing before the first case began', () => {
    expect(momentAt({ timeline: TIMELINE, ms: 500 })).toEqual({
      chapterIndex: -1,
      stepIndex: -1,
      isBetween: false,
    });
  });

  it('takes the start of a step as part of it', () => {
    expect(momentAt({ timeline: TIMELINE, ms: 8_000 })).toMatchObject({
      chapterIndex: 1,
      stepIndex: 0,
    });
  });
});
