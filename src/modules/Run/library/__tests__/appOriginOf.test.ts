import type { INetworkEntry } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { appOriginOf } from '@/modules/Run/library';

const entry = (props: Partial<INetworkEntry> & { url: string }): INetworkEntry => ({
  id: 1,
  method: 'GET',
  type: 'fetch',
  status: 200,
  failure: null,
  startedAt: 1_000,
  durationMs: 10,
  size: null,
  ...props,
});

describe('appOriginOf', () => {
  it('takes the origin of the first page the browser loaded', () => {
    expect(
      appOriginOf([
        entry({ url: 'https://cdn.test/app.js', type: 'script', startedAt: 900 }),
        entry({ url: 'https://shop.test/', type: 'document', startedAt: 1_000 }),
        entry({ url: 'https://login.test/', type: 'document', startedAt: 2_000 }),
      ]),
    ).toBe('https://shop.test');
  });

  it('falls back on the first request when no page loaded', () => {
    expect(
      appOriginOf([
        entry({ url: 'https://api.test/b', startedAt: 2_000 }),
        entry({ url: 'https://api.test/a', startedAt: 1_000 }),
      ]),
    ).toBe('https://api.test');
  });

  it('has no origin for a run with no requests', () => {
    expect(appOriginOf([])).toBeNull();
  });
});
