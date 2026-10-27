import { describe, expect, it } from 'vitest';
import { bytesLabelOf } from '@/modules/Pro/library';

describe('bytesLabelOf', () => {
  it('says a size in the largest unit under a thousand of it, with one decimal', () => {
    expect(bytesLabelOf({ bytes: 512, language: 'en' })).toBe('512 B');
    expect(bytesLabelOf({ bytes: 1_500, language: 'en' })).toBe('1.5 KB');
    expect(bytesLabelOf({ bytes: 210_000_000, language: 'en' })).toBe('210 MB');
    expect(bytesLabelOf({ bytes: 1_440_000_000, language: 'en' })).toBe('1.4 GB');
  });

  it('writes the decimal the way the language does', () => {
    expect(bytesLabelOf({ bytes: 1_440_000_000, language: 'pt' })).toBe('1,4 GB');
  });

  it('stays in gigabytes past a thousand of them, and says nothing for no media', () => {
    expect(bytesLabelOf({ bytes: 2_500_000_000_000, language: 'en' })).toBe('2,500 GB');
    expect(bytesLabelOf({ bytes: 0, language: 'en' })).toBe('0 B');
    expect(bytesLabelOf({ bytes: -5, language: 'en' })).toBe('0 B');
  });
});
