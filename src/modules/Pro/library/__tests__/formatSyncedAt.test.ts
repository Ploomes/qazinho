import { describe, expect, it } from 'vitest';
import { formatSyncedAt } from '@/modules/Pro/library';

describe('formatSyncedAt', () => {
  it('writes the day and the time in the QA’s language, on a 24-hour clock', () => {
    const at = new Date(2026, 9, 24, 14, 5).toISOString();

    expect(formatSyncedAt({ at, language: 'en' })).toMatch(/Oct.*14:05/);
    expect(formatSyncedAt({ at, language: 'pt' })).toMatch(/out.*14:05/);
  });
});
