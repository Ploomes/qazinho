import { describe, expect, it } from 'vitest';
import { networkOf } from '@/main/classes/storage/Archive/library';

const ENTRY = {
  id: 1,
  method: 'POST',
  url: 'https://shop.test/api/coupon',
  type: 'fetch',
  status: 500,
  failure: null,
  startedAt: 1_760_000_003_000,
  durationMs: 812,
  size: 64,
};

describe('networkOf', () => {
  it('reads back the requests a run kept', () => {
    expect(networkOf(JSON.stringify([ENTRY]))).toEqual([ENTRY]);
  });

  it('keeps a request still going when the run ended, with no status yet', () => {
    const going = { ...ENTRY, status: null, durationMs: null, size: null };

    expect(networkOf(JSON.stringify([going]))).toEqual([going]);
  });

  it('drops what is not a request, and reads a broken file as none', () => {
    expect(networkOf(JSON.stringify([ENTRY, { id: 'x' }, null]))).toEqual([ENTRY]);
    expect(networkOf('{"not": "a list"}')).toEqual([]);
    expect(networkOf('not json')).toEqual([]);
  });
});
