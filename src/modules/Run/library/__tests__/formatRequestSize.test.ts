import { describe, expect, it } from 'vitest';
import { formatRequestSize } from '@/modules/Run/library';

describe('formatRequestSize', () => {
  it('says a small answer in bytes', () => {
    expect(formatRequestSize({ bytes: 312, language: 'en' })).toBe('312 B');
  });

  it('says kilobytes with a decimal under ten, in the language the QA reads', () => {
    expect(formatRequestSize({ bytes: 1_843, language: 'en' })).toBe('1.8 kB');
    expect(formatRequestSize({ bytes: 1_843, language: 'pt' })).toBe('1,8 kB');
  });

  it('drops the decimal from ten kilobytes on', () => {
    expect(formatRequestSize({ bytes: 48_400, language: 'en' })).toBe('47 kB');
  });

  it('says megabytes with a decimal', () => {
    expect(formatRequestSize({ bytes: 3.25 * 1_024 * 1_024, language: 'en' })).toBe(
      '3.3 MB',
    );
  });
});
