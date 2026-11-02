import { describe, expect, it } from 'vitest';
import { percentLabelOf } from '@/modules/Settings/library';

describe('percentLabelOf', () => {
  it('rounds a share to a whole percent', () => {
    expect(percentLabelOf({ part: 54, total: 1400, language: 'en' })).toBe('4%');
    expect(percentLabelOf({ part: 1300, total: 1400, language: 'en' })).toBe('93%');
  });

  it('says less than one percent for a share that exists but is tiny, never zero', () => {
    expect(percentLabelOf({ part: 1, total: 1000, language: 'en' })).toBe('<1%');
  });

  it('says zero for a kind with nothing in it', () => {
    expect(percentLabelOf({ part: 0, total: 1000, language: 'en' })).toBe('0%');
  });

  it('does NOT divide by an empty total', () => {
    expect(percentLabelOf({ part: 0, total: 0, language: 'en' })).toBe('0%');
  });

  it('writes the percent the way the language does', () => {
    expect(percentLabelOf({ part: 1, total: 2, language: 'pt' })).toBe('50%');
  });
});
