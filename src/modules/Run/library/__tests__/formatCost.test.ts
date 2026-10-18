import { describe, expect, it } from 'vitest';
import { formatCost } from '@/modules/Run/library';

const plain = (text: string) => text.replace(/\u00a0/g, ' ');

describe('formatCost', () => {
  it('writes dollars the way each language writes money', () => {
    expect(formatCost({ costUsd: 1.234, language: 'en' })).toBe('$1.23');
    expect(plain(formatCost({ costUsd: 1.234, language: 'pt' }))).toBe('US$ 1,23');
  });

  it('keeps a tenth of a cent under a dime, so a cheap case does not read as nothing', () => {
    expect(formatCost({ costUsd: 0.0128, language: 'en' })).toBe('$0.013');
    expect(formatCost({ costUsd: 0.25, language: 'en' })).toBe('$0.25');
  });

  it('writes a run that cost nothing as zero, with its cents', () => {
    expect(formatCost({ costUsd: 0, language: 'en' })).toBe('$0.00');
  });
});
