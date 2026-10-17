import { describe, expect, it } from 'vitest';
import { formatResetsAt } from '@/shared/components/organisms/Titlebar/library';

describe('formatResetsAt', () => {
  it('reads as a clock time, so it never goes stale on screen', () => {
    expect(formatResetsAt(1_789_575_000)).toMatch(/^\d{1,2}:\d{2}/);
  });

  it('two windows an hour apart read an hour apart', () => {
    const [first, second] = [
      formatResetsAt(1_789_575_000),
      formatResetsAt(1_789_575_000 + 3_600),
    ];

    expect(first).not.toBe(second);
  });

  it('an agent that never reported a reset says nothing, not the epoch', () => {
    expect(formatResetsAt(0)).toBe('');
  });
});
