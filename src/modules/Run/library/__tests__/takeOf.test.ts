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
      steps: [],
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
