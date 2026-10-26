import { describe, expect, it } from 'vitest';
import { sizeWordsOf } from '@/modules/Settings/library';

describe('sizeWordsOf', () => {
  it('reads kilobytes, megabytes and gigabytes the way a disk does', () => {
    expect(sizeWordsOf({ bytes: 142 * 1024, language: 'en' })).toBe('142 kB');
    expect(sizeWordsOf({ bytes: 41 * 1024 * 1024, language: 'en' })).toBe('41 MB');
    expect(sizeWordsOf({ bytes: 1.5 * 1024 ** 3, language: 'en' })).toBe('1.5 GB');
  });

  it('writes the decimal the way the language does', () => {
    expect(sizeWordsOf({ bytes: 1.5 * 1024 ** 3, language: 'pt' })).toBe('1,5 GB');
  });

  it('reads nothing and a few bytes as kilobytes', () => {
    expect(sizeWordsOf({ bytes: 0, language: 'en' })).toBe('0 kB');
    expect(sizeWordsOf({ bytes: 300, language: 'en' })).toBe('0 kB');
  });

  it('stops at gigabytes', () => {
    expect(sizeWordsOf({ bytes: 3 * 1024 ** 4, language: 'en' })).toBe('3,072 GB');
  });
});
