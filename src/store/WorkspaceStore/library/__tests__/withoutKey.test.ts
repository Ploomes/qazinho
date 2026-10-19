import { describe, expect, it } from 'vitest';
import { withoutKey } from '@/store/WorkspaceStore/library';

describe('withoutKey', () => {
  it('drops the key it is given', () => {
    expect(withoutKey({ record: { w1: 1, w2: 2 }, key: 'w1' })).toEqual({ w2: 2 });
  });

  it('hands back the same record when the key was never there, so nothing re-renders', () => {
    const record = { w1: 1 };

    expect(withoutKey({ record, key: 'w9' })).toBe(record);
  });
});
