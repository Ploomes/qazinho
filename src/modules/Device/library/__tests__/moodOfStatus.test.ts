import { describe, expect, it } from 'vitest';
import { moodOfStatus } from '@/modules/Device/library';

describe('moodOfStatus', () => {
  it('sleeps while nothing is running, and when no workspace is open', () => {
    expect(moodOfStatus('idle')).toBe('sleeping');
    expect(moodOfStatus(null)).toBe('sleeping');
  });

  it('runs with the run, and waits on the QA when it needs them', () => {
    expect(moodOfStatus('running')).toBe('running');
    expect(moodOfStatus('attention')).toBe('thinking');
  });

  it('ends happy on a pass and alarmed on a failure', () => {
    expect(moodOfStatus('passed')).toBe('passed');
    expect(moodOfStatus('failed')).toBe('bug');
  });

  it('does NOT celebrate a run the QA stopped', () => {
    expect(moodOfStatus('stopped')).toBe('neutral');
  });
});
