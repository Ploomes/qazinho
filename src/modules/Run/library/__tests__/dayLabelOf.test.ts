import { describe, expect, it } from 'vitest';
import { dayLabelOf } from '@/modules/Run/library';

const NOW = new Date(2026, 9, 22, 9, 30);
const WORDS = { today: 'today', yesterday: 'yesterday' };
const label = (day: string | null, language = 'pt-BR') =>
  dayLabelOf({ day, now: NOW, language, words: WORDS });

describe('dayLabelOf', () => {
  it('says today and yesterday in words', () => {
    expect(label('2026-10-22')).toBe('today');
    expect(label('2026-10-21')).toBe('yesterday');
  });

  it('says an older day by its date, in the order the language writes it', () => {
    expect(label('2026-10-20')).toBe('20/10');
    expect(label('2026-10-20', 'en-US')).toBe('10/20');
  });

  it('adds the year only for another year, and says nothing for no day', () => {
    expect(label('2025-12-31')).toBe('31/12/2025');
    expect(label(null)).toBe('');
  });

  it('knows yesterday across a month', () => {
    expect(
      dayLabelOf({
        day: '2026-09-30',
        now: new Date(2026, 9, 1, 8),
        language: 'pt-BR',
        words: WORDS,
      }),
    ).toBe('yesterday');
  });
});
