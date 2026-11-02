import { describe, expect, it } from 'vitest';
import { sizePartsOf } from '@/modules/Settings/library';

describe('sizePartsOf', () => {
  it('splits the number from the unit, so the unit can sit smaller beside it', () => {
    expect(sizePartsOf({ bytes: 1.5 * 1024 ** 3, language: 'en' })).toEqual({
      value: '1.5',
      unit: 'GB',
    });
    expect(sizePartsOf({ bytes: 41 * 1024 * 1024, language: 'en' })).toEqual({
      value: '41',
      unit: 'MB',
    });
  });

  it('writes the decimal the way the language does', () => {
    expect(sizePartsOf({ bytes: 1.5 * 1024 ** 3, language: 'pt' })).toEqual({
      value: '1,5',
      unit: 'GB',
    });
  });

  it('reads nothing as zero kilobytes', () => {
    expect(sizePartsOf({ bytes: 0, language: 'en' })).toEqual({ value: '0', unit: 'kB' });
  });

  it('keeps the thousands of a size past the last unit in the number', () => {
    expect(sizePartsOf({ bytes: 3 * 1024 ** 4, language: 'en' })).toEqual({
      value: '3,072',
      unit: 'GB',
    });
  });
});
