import { describe, expect, it } from 'vitest';
import { releaseDayOf } from '@/modules/Help/library';

describe('releaseDayOf', () => {
  /** O `new Date("2026-11-15")` lê UTC, e a oeste dele mostrava o dia anterior. */
  it('reads the day as a local date, short, in the language of the QA', () => {
    expect(releaseDayOf({ date: '2026-11-15', language: 'pt-BR' })).toBe('15 de nov.');
    expect(releaseDayOf({ date: '2026-11-15', language: 'en' })).toBe('Nov 15');
  });
});
