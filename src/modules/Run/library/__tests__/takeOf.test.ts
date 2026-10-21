import type { IReplayTimeline } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { takeOf } from '@/modules/Run/library';

const TIMELINE: IReplayTimeline = {
  durationMs: 20_000,
  chapters: [
    {
      caseId: 'TC-01',
      title: 'Sign in',
      verdict: 'passed',
      fromMs: 1_000,
      toMs: 6_000,
      steps: [],
    },
    {
      caseId: 'TC-02',
      title: 'Checkout',
      verdict: 'failed',
      fromMs: 8_000,
      toMs: 19_500,
      steps: [
        {
          number: 1,
          action: 'Open the cart',
          verdict: 'passed',
          bugId: null,
          fromMs: 8_000,
          toMs: 12_000,
        },
        {
          number: 2,
          action: 'Apply the coupon',
          verdict: 'failed',
          bugId: 'BUG-01',
          fromMs: 12_000,
          toMs: 15_000,
        },
        {
          number: 3,
          action: 'Scroll to the footer',
          verdict: 'passed',
          bugId: null,
          fromMs: 15_000,
          toMs: 19_500,
        },
      ],
    },
  ],
  marks: [
    {
      bugId: 'BUG-01',
      title: 'Total wrong',
      severity: 'high',
      atMs: 15_000,
      caseId: 'TC-02',
      stepNumber: 2,
    },
    {
      bugId: 'BUG-02',
      title: 'Banner',
      severity: 'low',
      atMs: 9_000,
      caseId: 'TC-02',
      stepNumber: 1,
    },
    {
      bugId: 'BUG-03',
      title: 'Footer',
      severity: 'low',
      atMs: 19_000,
      caseId: 'TC-02',
      stepNumber: 3,
    },
    {
      bugId: 'BUG-04',
      title: 'Logo',
      severity: 'low',
      atMs: 3_000,
      caseId: 'TC-01',
      stepNumber: 4,
    },
  ],
};

describe('takeOf', () => {
  it('plays a case from its first step to its last', () => {
    expect(
      takeOf({ timeline: TIMELINE, focus: { kind: 'case', caseId: 'TC-01' } }),
    ).toEqual({
      fromMs: 1_000,
      toMs: 6_000,
    });
  });

  it('plays a bug from a few seconds before it was caught to a moment after', () => {
    expect(
      takeOf({ timeline: TIMELINE, focus: { kind: 'bug', bugId: 'BUG-01' } }),
    ).toEqual({
      fromMs: 11_000,
      toMs: 16_500,
    });
  });

  it('plays a bug filed mid-step on until that step ended, where the screen may only show it later', () => {
    expect(
      takeOf({ timeline: TIMELINE, focus: { kind: 'bug', bugId: 'BUG-02' } }),
    ).toEqual({
      fromMs: 8_000,
      toMs: 13_500,
    });
  });

  it('plays a bug whose step the video does not place to a moment after it', () => {
    expect(
      takeOf({ timeline: TIMELINE, focus: { kind: 'bug', bugId: 'BUG-04' } }),
    ).toEqual({
      fromMs: 1_000,
      toMs: 4_500,
    });
  });

  it('does NOT start a bug take before its own case began, nor end it past the video', () => {
    expect(
      takeOf({ timeline: TIMELINE, focus: { kind: 'bug', bugId: 'BUG-02' } })?.fromMs,
    ).toBe(8_000);
    expect(
      takeOf({ timeline: TIMELINE, focus: { kind: 'bug', bugId: 'BUG-03' } })?.toMs,
    ).toBe(20_000);
  });

  it('plays the whole run, and nothing for a case or a bug the video does not hold', () => {
    expect(takeOf({ timeline: TIMELINE, focus: { kind: 'run' } })).toBeNull();
    expect(
      takeOf({ timeline: TIMELINE, focus: { kind: 'case', caseId: 'TC-09' } }),
    ).toBeNull();
    expect(
      takeOf({ timeline: TIMELINE, focus: { kind: 'bug', bugId: 'BUG-09' } }),
    ).toBeNull();
  });
});
