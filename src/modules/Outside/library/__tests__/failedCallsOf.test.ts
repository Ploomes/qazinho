import type { INetworkEntry } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { failedCallsOf } from '@/modules/Outside/library';

const entry = (over: Partial<INetworkEntry>): INetworkEntry => ({
  id: 1,
  method: 'POST',
  url: 'https://shop.test/api/coupon',
  type: 'fetch',
  status: 200,
  failure: null,
  startedAt: 0,
  durationMs: 10,
  size: 10,
  ...over,
});

describe('failedCallsOf', () => {
  it('says nothing when every request went fine, or there is no record', () => {
    expect(failedCallsOf([entry({})])).toEqual([]);
    expect(failedCallsOf(null)).toEqual([]);
  });

  it('names a call that failed with what it answered', () => {
    expect(failedCallsOf([entry({ status: 500, body: ' {"error":"boom"} ' })])).toEqual([
      'Requests that failed:',
      '  POST https://shop.test/api/coupon → 500: {"error":"boom"}',
    ]);
  });

  it('names a request that never got an answer', () => {
    expect(
      failedCallsOf([entry({ status: null, failure: 'net::ERR_CONNECTION_REFUSED' })]),
    ).toEqual([
      'Requests that failed:',
      '  POST https://shop.test/api/coupon → net::ERR_CONNECTION_REFUSED',
    ]);
  });

  it('leaves out what the browser cancelled, and a missing image', () => {
    expect(
      failedCallsOf([
        entry({ status: null, failure: 'net::ERR_ABORTED' }),
        entry({ type: 'image', status: 404 }),
      ]),
    ).toEqual([]);
  });

  it('cuts a long answer and a long list', () => {
    const lines = failedCallsOf(
      Array.from({ length: 23 }, (_, id) =>
        entry({ id, status: 500, body: 'x'.repeat(900) }),
      ),
    );

    expect(lines).toHaveLength(22);
    expect(lines.at(-1)).toBe('  and 3 more.');
    expect(lines[1]?.length).toBeLessThan(400);
  });
});
