import { describe, expect, it } from 'vitest';
import { formatDay } from '@/modules/Setup/library';

describe('formatDay', () => {
  it('writes the day the way the language does', () => {
    expect(formatDay({ iso: '2026-09-16T12:00:00.000Z', language: 'en' })).toBe(
      'Sep 16, 2026',
    );
    expect(formatDay({ iso: '2026-09-16T12:00:00.000Z', language: 'pt' })).toBe(
      '16 de set. de 2026',
    );
  });

  it('shows what was stored when it is not a date', () => {
    expect(formatDay({ iso: 'yesterday', language: 'en' })).toBe('yesterday');
  });
});
