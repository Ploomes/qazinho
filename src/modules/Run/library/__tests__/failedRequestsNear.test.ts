import type { INetworkEntry } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { failedRequestsNear } from '@/modules/Run/library';

function entry(
  props: Partial<INetworkEntry> & { id: number; startedAt: number },
): INetworkEntry {
  return {
    method: 'GET',
    url: `https://shop.test/api/${String(props.id)}`,
    type: 'fetch',
    status: 200,
    failure: null,
    durationMs: 40,
    size: 10,
    ...props,
  };
}

const AT = 100_000;
const NEAR = { at: AT, beforeMs: 15_000, afterMs: 2_000, limit: 8 };

describe('failedRequestsNear', () => {
  it('keeps the ones that got an error or no answer around the moment, in the order they were made', () => {
    expect(
      failedRequestsNear({
        ...NEAR,
        entries: [
          entry({ id: 3, startedAt: AT - 1_000, status: 500 }),
          entry({ id: 1, startedAt: AT - 9_000, status: 404 }),
          entry({ id: 2, startedAt: AT - 5_000 }),
          entry({
            id: 4,
            startedAt: AT + 1_000,
            status: null,
            failure: 'net::ERR_CONNECTION_REFUSED',
          }),
        ],
      }).map(({ id }) => id),
    ).toEqual([1, 3, 4]);
  });

  it('does NOT keep one the app gave up on, or one long before or after the moment', () => {
    expect(
      failedRequestsNear({
        ...NEAR,
        entries: [
          entry({
            id: 1,
            startedAt: AT - 2_000,
            status: null,
            failure: 'net::ERR_ABORTED',
          }),
          entry({ id: 2, startedAt: AT - 16_000, status: 500 }),
          entry({ id: 3, startedAt: AT + 3_000, status: 500 }),
        ],
      }),
    ).toEqual([]);
  });

  it('keeps the closest ones when too many failed', () => {
    expect(
      failedRequestsNear({
        ...NEAR,
        limit: 2,
        entries: [1, 2, 3].map((id) =>
          entry({ id, startedAt: AT - 4_000 + id, status: 503 }),
        ),
      }).map(({ id }) => id),
    ).toEqual([2, 3]);
  });
});
