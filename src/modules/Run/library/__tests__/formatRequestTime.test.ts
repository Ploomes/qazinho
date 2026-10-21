import { describe, expect, it } from 'vitest';
import { formatRequestTime } from '@/modules/Run/library';

describe('formatRequestTime', () => {
  it('says a request under a second in whole milliseconds', () => {
    expect(formatRequestTime({ ms: 182.4, language: 'en' })).toBe('182 ms');
    expect(formatRequestTime({ ms: 0, language: 'en' })).toBe('0 ms');
  });

  it('says a slower one in seconds with a decimal, in the language the QA reads', () => {
    expect(formatRequestTime({ ms: 1_430, language: 'en' })).toBe('1.4 s');
    expect(formatRequestTime({ ms: 1_430, language: 'pt' })).toBe('1,4 s');
  });

  it('drops the decimal from ten seconds on', () => {
    expect(formatRequestTime({ ms: 12_600, language: 'en' })).toBe('13 s');
  });

  it('never says a time below zero', () => {
    expect(formatRequestTime({ ms: -40, language: 'en' })).toBe('0 ms');
  });
});
