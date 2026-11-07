import { afterEach, describe, expect, it, vi } from 'vitest';
import { withinWait } from '@/modules/Outside/library';

afterEach(() => {
  vi.useRealTimers();
});

describe('withinWait', () => {
  it('answers with the call when it ends in time', async () => {
    await expect(
      withinWait({
        work: Promise.resolve({ text: 'done', isError: false }),
        ms: 1_000,
        pending: 'still waiting',
      }),
    ).resolves.toEqual({ text: 'done', isError: false });
  });

  it('says it still waits when the call outlasts the wait, and lets the call go on', async () => {
    vi.useFakeTimers();
    let finish = (_done: { text: string; isError: boolean }) => {};
    const work = new Promise<{ text: string; isError: boolean }>((done) => {
      finish = done;
    });

    const answer = withinWait({ work, ms: 45_000, pending: 'still waiting' });

    await vi.advanceTimersByTimeAsync(45_000);
    await expect(answer).resolves.toEqual({ text: 'still waiting', isError: false });

    finish({ text: 'done later', isError: false });
    await expect(work).resolves.toEqual({ text: 'done later', isError: false });
  });

  it('does NOT leave a call that fails late unhandled', async () => {
    vi.useFakeTimers();
    let fail = (_reason: Error) => {};
    const work = new Promise<{ text: string; isError: boolean }>((_, reject) => {
      fail = reject;
    });

    const answer = withinWait({ work, ms: 10, pending: 'still waiting' });

    await vi.advanceTimersByTimeAsync(10);
    fail(new Error('gone'));

    await expect(answer).resolves.toMatchObject({ text: 'still waiting' });
  });
});
