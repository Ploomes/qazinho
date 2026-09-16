// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveLater } from '@/hooks/useArchive/library';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('saveLater', () => {
  it('a burst of changes writes once, at the end', () => {
    const later = saveLater(700);
    const write = vi.fn();

    later.save('w1', write);
    later.save('w1', write);
    later.save('w1', write);
    vi.advanceTimersByTime(700);

    expect(write).toHaveBeenCalledTimes(1);
  });

  it('two workspaces do not wait on each other', () => {
    const later = saveLater(700);
    const first = vi.fn();
    const second = vi.fn();

    later.save('w1', first);
    later.save('w2', second);
    vi.advanceTimersByTime(700);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('nothing is lost when the page goes away mid-wait', () => {
    const later = saveLater(700);
    const write = vi.fn();

    later.save('w1', write);
    later.flush();

    expect(write).toHaveBeenCalledTimes(1);
  });

  it('a flush does not leave the write to happen twice', () => {
    const later = saveLater(700);
    const write = vi.fn();

    later.save('w1', write);
    later.flush();
    vi.advanceTimersByTime(700);

    expect(write).toHaveBeenCalledTimes(1);
  });
});
