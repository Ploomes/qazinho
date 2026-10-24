import { describe, expect, it } from 'vitest';
import { fetchFailureOf } from '@/main/classes/pro/ProDownloads/library';

describe('fetchFailureOf', () => {
  it('names a machine the platform no longer takes as signed out', () => {
    expect(fetchFailureOf({ status: 401 })).toBe('signed-out');
  });

  it('calls no answer, or a broken platform, unreachable', () => {
    expect(fetchFailureOf({ status: 0 })).toBe('unreachable');
    expect(fetchFailureOf({ status: 502 })).toBe('unreachable');
  });

  it('calls any other refusal a failure', () => {
    expect(fetchFailureOf({ status: 403 })).toBe('failed');
    expect(fetchFailureOf({ status: 404 })).toBe('failed');
  });
});
