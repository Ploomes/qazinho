import { describe, expect, it } from 'vitest';
import { tallyPartsOf } from '@/modules/Run/library';

const say = (key: string, values: { count: number }) => `${key}:${String(values.count)}`;

describe('tallyPartsOf', () => {
  it('says the failures first, then what passed', () => {
    expect(tallyPartsOf({ failed: 9, passed: 2, say })).toEqual([
      'CHAT.RUN_FAILED_OTHER:9',
      'CHAT.RUN_PASSED_OTHER:2',
    ]);
  });

  it('counts the cases that could not be walked', () => {
    expect(tallyPartsOf({ failed: 0, blocked: 2, passed: 1, say })).toEqual([
      'RUN.TALLY_BLOCKED_OTHER:2',
      'CHAT.RUN_PASSED_ONE:1',
    ]);
  });

  it('words one case apart from many', () => {
    expect(tallyPartsOf({ failed: 1, passed: 1, say })).toEqual([
      'CHAT.RUN_FAILED_ONE:1',
      'CHAT.RUN_PASSED_ONE:1',
    ]);
  });

  it('says nothing about a group with no case in it', () => {
    expect(tallyPartsOf({ failed: 0, passed: 3, say })).toEqual([
      'CHAT.RUN_PASSED_OTHER:3',
    ]);
    expect(tallyPartsOf({ failed: 0, passed: 0, say })).toEqual([]);
  });
});
