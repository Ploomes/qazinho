import type { INetworkEntry } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { replayRequestsOf } from '@/modules/Run/library';

const VIDEO = { startedAt: 10_000, durationMs: 60_000 };

const entry = (props: Partial<INetworkEntry>): INetworkEntry => ({
  id: 1,
  method: 'GET',
  url: 'https://shop.test/',
  type: 'document',
  status: 200,
  failure: null,
  startedAt: 12_000,
  durationMs: 300,
  size: 1_884,
  ...props,
});

describe('replayRequestsOf', () => {
  it('places each request on the video by when it started and ended', () => {
    const [request] = replayRequestsOf({ entries: [entry({})], video: VIDEO });

    expect(request).toMatchObject({ fromMs: 2_000, toMs: 2_300, outcome: 'ok' });
  });

  it('starts a request made before the video at its first frame, ended where it ended', () => {
    const [early, before] = replayRequestsOf({
      entries: [
        entry({ id: 1, startedAt: 9_000, durationMs: 2_500 }),
        entry({ id: 2, startedAt: 8_000, durationMs: 500 }),
      ],
      video: VIDEO,
    });

    expect(early).toMatchObject({ fromMs: 0, toMs: 1_500 });
    expect(before).toMatchObject({ fromMs: 0, toMs: 0 });
  });

  it('keeps a request that never ended open, with no end on the video', () => {
    const [request] = replayRequestsOf({
      entries: [entry({ durationMs: null, status: null })],
      video: VIDEO,
    });

    expect(request).toMatchObject({ toMs: null, outcome: 'unknown' });
  });

  it('shows the host only of a request that left the app', () => {
    const requests = replayRequestsOf({
      entries: [
        entry({ id: 1, url: 'https://shop.test/' }),
        entry({
          id: 2,
          url: 'https://shop.test/api/cart',
          type: 'fetch',
          startedAt: 13_000,
        }),
        entry({
          id: 3,
          url: 'https://stats.test/collect',
          type: 'fetch',
          startedAt: 14_000,
        }),
      ],
      video: VIDEO,
    });

    expect(requests.map(({ host, path }) => ({ host, path }))).toEqual([
      { host: null, path: '/' },
      { host: null, path: '/api/cart' },
      { host: 'stats.test', path: '/collect' },
    ]);
  });

  it('marks scripts, styles, images and fonts as files', () => {
    const requests = replayRequestsOf({
      entries: [
        entry({ id: 1 }),
        entry({ id: 2, type: 'script', startedAt: 12_100 }),
        entry({ id: 3, type: 'fetch', startedAt: 12_200 }),
        entry({ id: 4, type: 'image', startedAt: 12_300 }),
      ],
      video: VIDEO,
    });

    expect(requests.map(({ isFile }) => isFile)).toEqual([false, true, false, true]);
  });

  it('orders the requests by when they started, the first one noted first on a tie', () => {
    const requests = replayRequestsOf({
      entries: [
        entry({ id: 3, startedAt: 15_000 }),
        entry({ id: 2, startedAt: 12_000 }),
        entry({ id: 1, startedAt: 12_000 }),
      ],
      video: VIDEO,
    });

    expect(requests.map(({ id }) => id)).toEqual([1, 2, 3]);
  });
});
