import { describe, expect, it } from 'vitest';
import { countOf } from '@/modules/Assistant/library/countOf';

describe('countOf', () => {
  it('stays singular only for one', () => {
    expect(countOf({ amount: 1, noun: 'case' })).toBe('1 case');
    expect(countOf({ amount: 0, noun: 'case' })).toBe('0 cases');
    expect(countOf({ amount: 2, noun: 'open bug' })).toBe('2 open bugs');
  });
});
