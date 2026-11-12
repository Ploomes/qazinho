import type { IReplayRequest } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { NETWORK } from '@/modules/Run/constants';
import { networkAt } from '@/modules/Run/library';

const request = (props: Partial<IReplayRequest>): IReplayRequest => ({
  id: 1,
  method: 'GET',
  url: 'https://shop.test/api',
  host: null,
  path: '/api',
  type: 'fetch',
  isApi: true,
  outcome: 'ok',
  status: 200,
  failure: null,
  fromMs: 1_000,
  toMs: 1_400,
  durationMs: 400,
  size: 120,
  body: null,
  ...props,
});

const REQUESTS = [
  request({
    id: 1,
    fromMs: 0,
    toMs: 200,
    durationMs: 200,
    type: 'document',
    isApi: false,
  }),
  request({
    id: 2,
    fromMs: 100,
    toMs: 150,
    durationMs: 50,
    type: 'script',
    isApi: false,
  }),
  request({ id: 3, fromMs: 1_000, toMs: 1_400, outcome: 'server', status: 500 }),
  request({ id: 4, fromMs: 2_000, toMs: null, durationMs: null, outcome: 'unknown' }),
];

describe('networkAt', () => {
  /** A faixa mostrava páginas e o favicon; o QA quer só as chamadas de API. */
  it('shows only the API calls that started by the moment the video is at', () => {
    const at = networkAt({ requests: REQUESTS, atMs: 1_200, isShowingAll: false });

    expect(at.rows.map(({ request: { id } }) => id)).toEqual([3]);
    expect(at).toMatchObject({ shown: 1, total: 2, others: 2 });
  });

  it('keeps a request waiting until its answer came, counting how long so far', () => {
    const [waiting] = networkAt({
      requests: REQUESTS,
      atMs: 1_250,
      isShowingAll: false,
    }).rows;

    expect(waiting).toMatchObject({ isDone: false, elapsedMs: 250 });
  });

  it('ends a request once the video reaches its answer, with how long it took', () => {
    const [ended] = networkAt({
      requests: REQUESTS,
      atMs: 1_400,
      isShowingAll: false,
    }).rows;

    expect(ended).toMatchObject({ isDone: true, elapsedMs: 400 });
  });

  it('counts an error only once its answer showed', () => {
    expect(
      networkAt({ requests: REQUESTS, atMs: 1_300, isShowingAll: false }).errors,
    ).toBe(0);
    expect(
      networkAt({ requests: REQUESTS, atMs: 1_500, isShowingAll: false }).errors,
    ).toBe(1);
  });

  it('never ends a request that never ended', () => {
    const rows = networkAt({
      requests: REQUESTS,
      atMs: 60_000,
      isShowingAll: false,
    }).rows;

    expect(rows.at(-1)).toMatchObject({ isDone: false, elapsedMs: 58_000 });
  });

  it('shows every request once the QA asks for all of them', () => {
    const at = networkAt({ requests: REQUESTS, atMs: 1_200, isShowingAll: true });

    expect(at.rows.map(({ request: { id } }) => id)).toEqual([1, 2, 3]);
    expect(at.total).toBe(4);
  });

  it('keeps only the latest rows, and says how many earlier ones it left out', () => {
    const many = Array.from({ length: NETWORK.rowLimit + 5 }, (_, index) =>
      request({ id: index + 1, fromMs: index * 10, toMs: index * 10 + 5 }),
    );
    const at = networkAt({ requests: many, atMs: 100_000, isShowingAll: false });

    expect(at.rows).toHaveLength(NETWORK.rowLimit);
    expect(at.rows[0]?.request.id).toBe(6);
    expect(at.earlier).toBe(5);
  });

  it('shows nothing before the first request started', () => {
    const at = networkAt({
      requests: [request({ fromMs: 3_000 })],
      atMs: 0,
      isShowingAll: false,
    });

    expect(at).toMatchObject({ rows: [], shown: 0, total: 1, earlier: 0 });
  });
});
