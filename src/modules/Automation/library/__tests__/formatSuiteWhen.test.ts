import { describe, expect, it } from 'vitest';
import { formatSuiteWhen } from '@/modules/Automation/library';

const AT = new Date(2026, 9, 21, 14, 5).getTime();

describe('formatSuiteWhen', () => {
  it('writes the day and the time the way each language does', () => {
    expect(formatSuiteWhen({ at: AT, language: 'en' })).toBe('Oct 21, 14:05');
    expect(formatSuiteWhen({ at: AT, language: 'pt' })).toBe('21 de out., 14:05');
  });

  it('keeps a 24-hour clock, with no AM or PM', () => {
    expect(
      formatSuiteWhen({ at: new Date(2026, 9, 21, 21, 40).getTime(), language: 'en' }),
    ).toBe('Oct 21, 21:40');
  });
});
